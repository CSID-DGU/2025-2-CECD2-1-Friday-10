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
  
  // temp index 33-35 (33: Neck, 34: Chest, 35: Hips)

  // 1. Hips 및 Spine 회전
  
  // 힙 회전 계산: 전방 벡터(평면 법선) 및 상향 벡터(힙-척추 방향)
  const p_rHip = pts[24];
  const p_lHip = pts[23];
  const p_pelvis = pts[34];
  const p_spine = pts[35];

  // Forward (Z): Hips 평면의 법선. (L_Hip -> R_Hip) x (L_Hip -> Spine)
  // Three.js 기준: 법선이 -Z(앞)
  const v_hip_lr = p_rHip.clone().sub(p_lHip); // L->R 힙 벡터
  const v_hip_ls = p_spine.clone().sub(p_lHip); // L_Hip -> Spine 벡터
  
  // 외적 순서 조정: v_hip_lr x v_hip_ls. 순서에 따라 법선 벡터의 방향 결정
  const hipsForward = new THREE.Vector3().crossVectors(v_hip_lr, v_hip_ls).normalize(); 
  
  // Upward (Y): Hip mid ->  Spine
  const hipsUpward = p_spine.clone().sub(p_pelvis).normalize(); 
  
  const hipLook = lookRotation(hipsForward, hipsUpward);
  const hipWorld = hipLook.clone().multiply(restQuats['hips'].clone().invert()); 
  out['hips'] = hipWorld;


  const p_neck = pts[33];   // Neck
  const p_rShoulder = pts[12];
  const p_lShoulder = pts[11];

  // Forward (Z): Shoulder 평면의 법선
  const v_sh_lr = p_rShoulder.clone().sub(p_lShoulder); // L->R shoulder vector
  const v_sh_ls = p_spine.clone().sub(p_lShoulder); // L_Shoulder -> Spine vector
  
  const chestForward = new THREE.Vector3().crossVectors(v_sh_ls, v_sh_lr).normalize(); 
  
  // Upward (Y): 스파인 중앙에서 목으로
  const chestUpward = p_neck.clone().sub(p_spine).normalize(); 
  
  const chestLook = lookRotation(chestForward, chestUpward);
  const chestWorld = chestLook.clone().multiply(restQuats['chest'].clone().invert());
  out['chest'] = hipWorld?.clone().invert().multiply(chestWorld); 


  // head & neck
  const p_nose = pts[0];
  const p_left_eye = pts[7];
  const p_right_eye = pts[8];
  const p_mid_eye = p_left_eye.clone().add(p_right_eye).multiplyScalar(0.5);

  // Forward(Z): Eye 평면의 법선
  const v_eye_lr = p_right_eye.clone().sub(p_left_eye);
  const v_eye_ls = p_neck.clone().sub(p_left_eye);

  const headForward = new THREE.Vector3().crossVectors(v_eye_ls, v_eye_lr).normalize();

  // upward
  const headUpward = p_mid_eye.clone().sub(p_neck).normalize();

  const headLook = lookRotation(headForward, headUpward);
  const headWorld = headLook.clone().multiply(restQuats['neck'].clone().invert());
  out['head'] = chestWorld.clone().invert().multiply(headWorld);
  out['neck'] = out['head'];

  // Arm
  // left
  const p_lElbow = pts[13];
  const p_lWrist = pts[15];

  const v_l_u_arm = p_lShoulder.clone().sub(p_lElbow);
  const v_l_l_arm = p_lElbow.clone().sub(p_lWrist);

  const leftArmUpward = new THREE.Vector3().crossVectors(v_l_l_arm, v_l_u_arm).normalize();
  const leftUpperArmForward = new THREE.Vector3().crossVectors(v_l_u_arm, leftArmUpward).normalize();
  const leftUpperArmLook = lookRotation(leftUpperArmForward, leftArmUpward);
  const leftUpperArmWorld = leftUpperArmLook.clone().multiply(restQuats['leftUpperArm'].clone().invert());
  out['leftUpperArm'] = chestWorld?.clone().invert().multiply(leftUpperArmWorld); 

  const leftLowerArmForward = new THREE.Vector3().crossVectors(v_l_l_arm, leftArmUpward).normalize();
  const leftLowerArmLook = lookRotation(leftLowerArmForward, leftArmUpward);
  const leftLowerArmWorld = leftLowerArmLook.clone().multiply(restQuats['leftLowerArm'].clone().invert());
  out['leftLowerArm'] = leftUpperArmWorld?.clone().invert().multiply(leftLowerArmWorld);

  // right
  const p_rElbow = pts[14];
  const p_rWrist = pts[16];

  const v_r_u_arm = p_rElbow.clone().sub(p_rShoulder);
  const v_r_l_arm = p_rWrist.clone().sub(p_rElbow);

  const rightArmUpward = new THREE.Vector3().crossVectors(v_r_u_arm, v_r_l_arm).normalize();

  const rightUpperArmForward = new THREE.Vector3().crossVectors(v_r_u_arm, rightArmUpward).normalize();
  const rightUpperArmLook = lookRotation(rightUpperArmForward, rightArmUpward);
  const rightUpperArmWorld = rightUpperArmLook.clone().multiply(restQuats['rightUpperArm'].clone().invert());
  out['rightUpperArm'] = chestWorld?.clone().invert().multiply(rightUpperArmWorld)

  const rightLowerArmForward = new THREE.Vector3().crossVectors(v_r_l_arm, rightArmUpward).normalize();
  const rightLowerArmLook = lookRotation(rightLowerArmForward, rightArmUpward);
  const rightLowerArmWorld = rightLowerArmLook.clone().multiply(restQuats['rightLowerArm'].clone().invert());
  out['rightLowerArm'] = rightUpperArmWorld?.clone().invert().multiply(rightLowerArmWorld);


  // Leg
  // left
  const p_lKnee = pts[25];
  const p_lAnkle = pts[27];

  const leftUpperLegUpward = p_lHip.clone().sub(p_lKnee);
  const leftLowerLegUpward = p_lKnee.clone().sub(p_lAnkle);

  const leftLegLeft = new THREE.Vector3().crossVectors(leftLowerLegUpward, leftUpperLegUpward);

  const leftUpperLegForward = new THREE.Vector3().crossVectors(leftLegLeft, leftUpperLegUpward);
  const leftUpperLegLook = lookRotation(leftUpperLegForward, leftUpperLegUpward);
  const leftUpperLegWorld = leftUpperLegLook.clone().multiply(restQuats['leftUpperLeg'].clone().invert());
  out['leftUpperLeg'] = hipWorld?.clone().invert().multiply(leftUpperLegWorld);

  const leftLowerLegForward = new THREE.Vector3().crossVectors(leftLegLeft, leftLowerLegUpward);
  const leftLowerLegLook = lookRotation(leftLowerLegForward, leftLowerLegUpward);
  const leftLowerLegWorld = leftLowerLegLook.clone().multiply(restQuats['leftLowerLeg'].clone().invert());
  out['leftLowerLeg'] = leftUpperLegWorld?.clone().invert().multiply(leftLowerLegWorld);

  // right
  const p_rKnee = pts[26];
  const p_rAnkle = pts[28];

  const rightUpperLegUpward = p_rHip.clone().sub(p_rKnee);
  const rightLowerLegUpward = p_rKnee.clone().sub(p_rAnkle);

  const rightLegLeft = new THREE.Vector3().crossVectors(rightLowerLegUpward, rightUpperLegUpward);

  const rightUpperLegForward = new THREE.Vector3().crossVectors(rightLegLeft, rightUpperLegUpward);
  const rightUpperLegLook = lookRotation(rightUpperLegForward, rightUpperLegUpward);
  const rightUpperLegWorld = rightUpperLegLook.clone().multiply(restQuats['rightUpperLeg'].clone().invert());
  out['rightUpperLeg'] = hipWorld?.clone().invert().multiply(rightUpperLegWorld);

  const rightLowerLegForward = new THREE.Vector3().crossVectors(rightLegLeft, rightLowerLegUpward);
  const rightLowerLegLook = lookRotation(rightLowerLegForward, rightLowerLegUpward);
  const rightLowerLegWorld = rightLowerLegLook.clone().multiply(restQuats['rightLowerLeg'].clone().invert());
  out['rightLowerLeg'] = rightUpperLegWorld?.clone().invert().multiply(rightLowerLegWorld);

  // Foot
  // left
  const p_lFoot = pts[31];
  const p_lHeel = pts[29];

  const leftFootForward = p_lHeel.clone().sub(p_lFoot);
  const leftFootUpward = p_lAnkle.clone().sub(p_lHeel);
  const leftFootLook = lookRotation(leftFootForward, leftFootUpward);
  const leftFootWorld = leftFootLook.clone().multiply(restQuats['leftFoot'].clone().invert());
  out['leftFoot'] = leftLowerLegWorld?.clone().invert().multiply(leftFootWorld);

  // right
  const p_rFoot = pts[32];
  const p_rHeel = pts[30];

  const rightFootForward = p_rHeel.clone().sub(p_rFoot);
  const rightFootUpward = p_rAnkle.clone().sub(p_rHeel);
  const rightFootLook = lookRotation(rightFootForward, rightFootUpward);
  const rightFootWorld = rightFootLook.clone().multiply(restQuats['rightFoot'].clone().invert());
  out['rightFoot'] = rightLowerLegWorld?.clone().invert().multiply(rightFootWorld);

  // TODO
  // Hand


  // -5 degree
  const correction = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-5));

  const rotatedForward = hipsForward.clone().applyQuaternion(correction);
  const rotatedUpward  = hipsUpward.clone().applyQuaternion(correction);

  // Look + rest correction
  const rotatedHipLook = lookRotation(rotatedForward, rotatedUpward);
  const rotatedHipWorld = rotatedHipLook.multiply(restQuats['hips'].clone().invert());
  out['hips'] = rotatedHipWorld;

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



// not usees

function triangleNormal(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): THREE.Vector3 {
    const v1 = p2.clone().sub(p1);
    const v2 = p3.clone().sub(p1);
    return v1.cross(v2).normalize();
}

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