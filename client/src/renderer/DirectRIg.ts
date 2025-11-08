// src/utils/directRig.ts
import * as THREE from 'three';
import type { VRMHumanBoneName } from '@pixiv/three-vrm';
import type { SkeletonFrame } from '../core/types';

interface BoneDef {
  /** VRM humanoid 에서 사용하는 본 이름 */
  name: VRMHumanBoneName;
  /** SkeletonFrame 배열에서 부모 관절 인덱스 */
  parentIndex: number;
  /** SkeletonFrame 배열에서 자식 관절 인덱스 */
  childIndex: number;
  /** 모델 기본(rest) 축. 보통 Y↑ 이지만, 필요에 따라 조정 가능 */
  restAxis: THREE.Vector3;
}
interface FullBoneDef extends BoneDef {
  upwardsIndex?: number; // 관절이 굽혀지는 방향을 결정하는 세 번째 관절 (옵션)
}

// bone definition
const BONE_DEFS_FULL: FullBoneDef[] = [
  // 몸통
  { name: 'hips',         parentIndex: 24, childIndex: 23, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 35 }, // Hips는 Shoulder-Hip 평면의 Normal로 회전
  { name: 'spine',        parentIndex: 23, childIndex: 24, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 33 }, // Spine은 Shoulder-Shoulder 평면의 Normal로 회전
  // 팔
  { name: 'leftUpperArm', parentIndex: 11, childIndex: 13, restAxis: new THREE.Vector3(1, 0, 0), upwardsIndex: 34 }, // upwards는 척추를 향하는 방향 (가슴 중앙)
  { name: 'leftLowerArm', parentIndex: 13, childIndex: 15, restAxis: new THREE.Vector3(1, 0, 0), upwardsIndex: 11 }, // upwards는 부모 관절을 향하는 방향
  { name: 'rightUpperArm',parentIndex: 12, childIndex: 14, restAxis: new THREE.Vector3(-1, 0, 0), upwardsIndex: 34 },
  { name: 'rightLowerArm',parentIndex: 14, childIndex: 16, restAxis: new THREE.Vector3(-1, 0, 0), upwardsIndex: 12 },
  // 머리
  { name: 'neck',         parentIndex: 33, childIndex: 0, restAxis: new THREE.Vector3(0, 1, 0) }, // Neck: 33(Neck) -> 0(Nose)
  { name: 'head',         parentIndex: 0, childIndex: 10, restAxis: new THREE.Vector3(0, 1, 0) }, // Head: 0(Nose) -> 10(Right Mouth) (임시 정의)
  // 다리
  { name: 'leftUpperLeg', parentIndex: 23, childIndex: 25, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 24 }, // upwards는 반대쪽 힙을 향하는 방향
  { name: 'leftLowerLeg', parentIndex: 25, childIndex: 27, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 23 }, // upwards는 부모 관절을 향하는 방향
  { name: 'rightUpperLeg',parentIndex: 24, childIndex: 26, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 23 },
  { name: 'rightLowerLeg',parentIndex: 26, childIndex: 28, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 24 },
  // 발목 (발 회전을 위해 LookRotation을 재정의)
  { name: 'leftFoot',     parentIndex: 27, childIndex: 31, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 25 }, // Toe를 forward, Knee를 upwards
  { name: 'rightFoot',    parentIndex: 28, childIndex: 32, restAxis: new THREE.Vector3(0, 1, 0), upwardsIndex: 26 }, // Toe를 forward, Knee를 upwards
];

export function directRig(frame: SkeletonFrame, restQuats: Record<VRMHumanBoneName, THREE.Quaternion>): Record<VRMHumanBoneName, THREE.Quaternion> {
  // 랜드마크 위치 (pt: point)
  const pts = frame.map(j => new THREE.Vector3(j.position[0], j.position[1], j.position[2]));
  const out: Partial<Record<VRMHumanBoneName, THREE.Quaternion>> = {};
  // const finalOut: Partial<Record<VRMHumanBoneName, THREE.Quaternion>> = {};

  const isValid = (index: number) => pts[index] !== undefined;
  
  // GHUM/MediaPipe 데이터는 33개 관절 (인덱스 0~32)를 사용합니다.
  // 이 코드에서는 33-36을 임시 몸통 관절로 사용하고 있습니다. (33: Neck, 34: Chest, 35: Hips)

  // 1. Hips 및 Spine 회전
  
  // 힙 회전 계산: 전방 벡터(평면 법선) 및 상향 벡터(힙-척추 방향)
  const p_rHip = pts[24];
  const p_lHip = pts[23];
  const p_spine = pts[35]; // mid spine 위치 (C# 코드를 따른 인덱스)

  if (isValid(24) && isValid(23) && isValid(35) && restQuats['hips']) {
    // Forward (Z): Hips 평면의 법선. (L_Hip -> R_Hip) x (L_Hip -> Spine)
    // Three.js 기준: 법선이 -Z(앞)을 향하도록 조정
    const v_hip_lr = p_rHip.clone().sub(p_lHip); // L->R 힙 벡터
    const v_hip_ls = p_spine.clone().sub(p_lHip); // L_Hip -> Spine 벡터
    
    // 외적 순서 조정: v_hip_lr x v_hip_ls. 순서에 따라 법선 벡터의 방향이 결정됩니다.
    const hipsForward = new THREE.Vector3().crossVectors(v_hip_lr, v_hip_ls).normalize(); 
    
    // Upward (Y): 힙 중앙에서 스파인 중앙으로
    const hipsUpward = p_spine.clone().sub(p_rHip.clone().add(p_lHip).multiplyScalar(0.5)).normalize(); 
    
    const hipLook = lookRotation(hipsForward, hipsUpward);
    const hipFinal = hipLook.clone().multiply(restQuats['hips'].clone().invert()); 
    out['hips'] = hipFinal;
  }
  const p_neck = pts[33];   // Neck 위치
  const p_rShoulder = pts[12];
  const p_lShoulder = pts[11];

  if (isValid(12) && isValid(11) && isValid(35) && isValid(33) && restQuats['chest']) {
    // Forward (Z): Shoulder 평면의 법선
    const v_sh_lr = p_rShoulder.clone().sub(p_lShoulder); // L->R 어깨 벡터
    const v_sh_ls = p_spine.clone().sub(p_lShoulder); // L_Shoulder -> Spine 벡터
    
    const chestForward = new THREE.Vector3().crossVectors(v_sh_ls, v_sh_lr).normalize(); 
    
    // Upward (Y): 스파인 중앙에서 목으로
    const chestUpward = p_neck.clone().sub(p_spine).normalize(); 
    
    const chestLook = lookRotation(chestForward, chestUpward);
    const chestFinal = chestLook.clone().multiply(restQuats['chest'].clone().invert());
    out['chest'] = chestFinal; 
  }

  // head & neck
  const p_nose = pts[0]; // 0번 랜드마크 (Nose)
  const p_left_eye = pts[7]; // 7번 랜드마크 (Left Eye)
  const p_right_eye = pts[8]; // 8번 랜드마크 (Right Eye)
  const p_mid_eye = p_left_eye.clone().add(p_right_eye).multiplyScalar(0.5);

  if (isValid(0) && isValid(7) && isValid(8) && isValid(33) && restQuats['head']) {
    // Forward(Z): Eye 평면의 법선
    const v_eye_lr = p_right_eye.clone().sub(p_left_eye);
    const v_eye_ls = p_neck.clone().sub(p_left_eye);

    const headForward = new THREE.Vector3().crossVectors(v_eye_ls, v_eye_lr).normalize();

    // upward
    const headUpward = p_mid_eye.clone().sub(p_neck).normalize();

    const headLook = lookRotation(headForward, headUpward);
    const headFinal = headLook.clone().multiply(restQuats['head'].clone().invert());
    out['head'] = headFinal;
    out['neck'] = headFinal;
  }

  // 나머지 사지
  for (const def of BONE_DEFS_FULL) {
    if (!isValid(def.parentIndex) || !isValid(def.childIndex) || !restQuats[def.name]) continue;
    if (def.name in ['head', 'neck', 'spine', 'hips', 'chest']) {
      continue;
    }

    const { name, parentIndex, childIndex } = def; 
    const p = pts[parentIndex];
    const c = pts[childIndex];

    // 팔
    if (name in ['leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm']) {
      // forward (Z) : (L -> R) x (L -> Spine)
      let v_arm_lr: THREE.Vector3;
      let v_arm_ls: THREE.Vector3;

      if (name.includes('left')) {
        v_arm_lr = c.clone().sub(p);
        v_arm_ls = p_spine.clone().sub(c)
      }
      else { // right
        v_arm_lr = p.clone().sub(c);
        v_arm_ls = p_spine.clone().sub(p);
      }

      const forward = new THREE.Vector3().crossVectors(v_arm_ls, v_arm_lr).normalize();

      // upward
      const upward = new THREE.Vector3().crossVectors(forward, v_arm_lr).normalize();

      const look = lookRotation(forward, upward);
      const final = look.clone().multiply(restQuats[name].clone().invert());

      out[name] = final;
    }
    // if (name in ['leftUpperArm', 'rightUpperArm']) {
    //   // 상박 (Upper Arm)
    //   const restQuatInv = restQuats[name].clone().invert();
    //   const forward = c.clone().sub(p).normalize(); // P -> C (뼈 방향)

    //   // Upward: Midspine(35) -> Parent(어깨)
    //   const up = pts[35].clone().sub(p).normalize(); 

    //   const look = lookRotation(forward, up);
    //   out[name] = look.clone().multiply(restQuatInv);
    // }
    // if (name in ['leftLowerArm', 'rightLowerArm']) {
    //   // 하박 (Lower Arm)
    //   const restQuatInv = restQuats[name].clone().invert();
    //   const forward = c.clone().sub(p).normalize(); // P -> C (뼈 방향)

    //   // Upward: Parent(팔꿈치) -> Child(손목)
    //   const up = p.clone().sub(c).normalize(); 

    //   const look = lookRotation(forward, up);
    //   out[name] = look.clone().multiply(restQuatInv);
    // }

    // 다리


    // // forward
    
    // // 1. forward (Z축): 뼈의 방향 (Parent -> Child)
    // const forward = c.clone().sub(p).normalize();
    
    // // 2. upward (Y축): 굽힘 평면을 고정하는 벡터
    // let up: THREE.Vector3;

    // if (name.includes('Lower') || name.includes('Foot')) {
    //     // Lower Arm/Leg/Foot: 굽힘 평면 고정 -> 부모 관절(Parent) 쪽을 Up으로
    //     // Up = Parent - Child
    //     up = p.clone().sub(c).normalize(); 
    // } else if (name.includes('Upper')) { 
    //     // Upper Arm/Leg: 회전 꼬임 방지 -> 몸통 중앙(35:midspine)을 향하도록
    //     // Up = Midspine(35) - Parent
    //     if (!isValid(35)) continue;
    //     up = pts[35].clone().sub(p).normalize();
    // } else {
    //     // 정의되지 않은 관절
    //     continue;
    // }
    
    // // 3. 쿼터니언 계산
    // const restQuatInv = restQuats[name].clone().invert();
    // const currentQuat = lookRotation(forward, up);
    
    // // 최종 회전 = Q_look * Q_rest_inv (델타 회전량)
    // const finalQuat = currentQuat.clone().multiply(restQuatInv);

    // out[name] = finalQuat;
  }



  // for (const def of BONE_DEFS_FULL) {
  //   if (!isValid(def.parentIndex) || !isValid(def.childIndex) || !restQuats[def.name]) continue;

  //   // upwardsIndex는 사용하지 않고 로직으로 Up 벡터를 강제합니다.
  //   const { name, parentIndex, childIndex } = def; 
  //   const p = pts[parentIndex];
  //   const c = pts[childIndex];

  //   const restQuatInv = restQuats[name].clone().invert();
  //   // Forward (Z축): 뼈의 방향 (Parent -> Child)
  //   const forward = c.clone().sub(p).normalize();
    
  //   let up: THREE.Vector3;

  //   if (name.includes('Lower') || name.includes('Foot')) {
  //       // Lower Arm/Leg/Foot: 굽힘 평면 고정 -> 부모 관절(Parent) 쪽을 Up으로
  //       // Up = Parent - Child
  //       up = p.clone().sub(c).normalize(); 
  //   } else if (name.includes('Upper')) { 
  //       // Upper Arm/Leg: 회전 꼬임 방지 -> 몸통 중앙(35:midspine)을 향하도록
  //       // Up = Midspine(35) - Parent
  //       if (!isValid(35)) continue;
  //       up = pts[35].clone().sub(p).normalize();
  //   } else {
  //       continue;
  //   }
    
  //   // 목표 회전 계산
  //   const currentQuat = lookRotation(forward, up);
  //   // 최종 회전 = Q_look * Q_rest_inv
  //   const finalQuat = currentQuat.clone().multiply(restQuatInv);

  //   out[name] = finalQuat;
  // }

  return out as Record<VRMHumanBoneName, THREE.Quaternion>;
}

function lookRotation(forward: THREE.Vector3, up: THREE.Vector3): THREE.Quaternion {
  const forwardVec = forward.clone().normalize();
  
  // 1. Right 벡터(X축) 계산
  const right = new THREE.Vector3().crossVectors(forwardVec, up).normalize();
  
  // 2. New Up 벡터(Y축) 계산
  const newUp = new THREE.Vector3().crossVectors(right, forwardVec).normalize();

  const m = new THREE.Matrix4();
  
  // Three.js 표준: Z축을 -Forward로 설정 (카메라를 향하는 Z+ 방향과 일치)
  m.makeBasis(right, newUp, forwardVec.clone().negate()); 
  
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(m);
  return quaternion;
}

function triangleNormal(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): THREE.Vector3 {
    const v1 = p2.clone().sub(p1);
    const v2 = p3.clone().sub(p1);
    return v1.cross(v2).normalize();
}


// not use
function computeTwistQuaternion(from: THREE.Vector3, to: THREE.Vector3): THREE.Quaternion {
  const q = new THREE.Quaternion();
  if (from.dot(to) < -0.999999) {
    // 180도 회전 (반대 방향)
    const axis = new THREE.Vector3(0, -1, 0);
    q.setFromAxisAngle(axis, Math.PI);
  } else {
    q.setFromUnitVectors(from, to);
  }
  return q;
}

function computeLocalQuaternion(
    parentWorldQuat: THREE.Quaternion,
    childWorldQuat: THREE.Quaternion
): THREE.Quaternion {
    
    const parentWorldInv = parentWorldQuat?.clone().invert();

    const childLocalQuat = parentWorldInv.multiply(childWorldQuat);
    
    return childLocalQuat;
}