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

// bone definition
const BONE_DEFS: BoneDef[] = [
  { name: 'hips',         parentIndex: 35, childIndex: 34, restAxis: new THREE.Vector3(0, 1, 0) },
  { name: 'spine',        parentIndex: 33, childIndex: 35, restAxis: new THREE.Vector3(0, 1, 0) },

  { name: 'leftUpperArm', parentIndex: 11, childIndex: 13, restAxis: new THREE.Vector3(1, 0, 0) },
  { name: 'leftLowerArm', parentIndex: 13, childIndex: 15, restAxis: new THREE.Vector3(1, 0, 0) },

  { name: 'rightUpperArm',parentIndex: 12, childIndex: 14, restAxis: new THREE.Vector3(-1, 0, 0) },
  { name: 'rightLowerArm',parentIndex: 14, childIndex: 16, restAxis: new THREE.Vector3(-1, 0, 0) },

  { name: 'leftUpperLeg', parentIndex: 23, childIndex: 25, restAxis: new THREE.Vector3(0, 1, 0) },
  { name: 'leftLowerLeg', parentIndex: 25, childIndex: 27, restAxis: new THREE.Vector3(0, 1, 0) },

  { name: 'rightUpperLeg',parentIndex: 24, childIndex: 26, restAxis: new THREE.Vector3(0, 1, 0) },
  { name: 'rightLowerLeg',parentIndex: 26, childIndex: 28, restAxis: new THREE.Vector3(0, 1, 0) },
];

export function directRig(frame: SkeletonFrame, restQuats: Record<VRMHumanBoneName, THREE.Quaternion>): Record<VRMHumanBoneName, THREE.Quaternion> {
  // keletonFrame ➡ THREE.Vector3 array
  const pts = frame.map(j => new THREE.Vector3(j.position[0], j.position[1], j.position[2]));

  const out: Partial<Record<VRMHumanBoneName, THREE.Quaternion>> = {};

  // torso twist
  const lShoulder = pts[11];
  const rShoulder = pts[12];
  const lHip = pts[23];
  const rHip = pts[24];

  const upperTorsoRight = rShoulder.clone().sub(lShoulder).normalize();
  const lowerTorsoRight = rHip.clone().sub(lHip).normalize();

  const restRight = new THREE.Vector3(-1, 0, 0); // T-pose 기준: 오른쪽

  const upperTorsoTwist = computeTwistQuaternion(restRight, upperTorsoRight);
  const lowerTorsoTwist = computeTwistQuaternion(restRight, lowerTorsoRight);

  out['chest'] = upperTorsoTwist;
  out['hips'] = lowerTorsoTwist;

  // 정의된 본마다
  for (const { name, parentIndex, childIndex, restAxis } of BONE_DEFS) {
    const p = pts[parentIndex];
    const c = pts[childIndex];
    const dir = c.clone().sub(p).normalize();
  
    const currentQuat = new THREE.Quaternion().setFromUnitVectors(restAxis, dir);
  
    // 회전 기준 torso에 따라 보정
    const restQuatInv = restQuats[name].clone().invert();
  
    const basisQuat = name.includes('Leg') ? lowerTorsoTwist : upperTorsoTwist;
    const finalQuat = restQuatInv.multiply(currentQuat).premultiply(basisQuat); // basisQuat 먼저 적용
  
    out[name] = finalQuat;
  }
  // 타입 단언 후 return
  return out as Record<VRMHumanBoneName, THREE.Quaternion>;
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