// src/renderer/CharacterRenderer.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMUtils, VRMLoaderPlugin, VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { directRig } from './DirectRIg'; // 수정된 directRig 로직 가정
import type { SkeletonFrame } from '../core/types';


export class CharacterRenderer {
  private scene: THREE.Scene;
  private vrm: VRM | null = null;
  private loader: GLTFLoader;

  private clock: THREE.Clock = new THREE.Clock();
  
  // T-Pose 상태에서 각 뼈대의 초기 (Rest) 쿼터니언을 저장합니다.
  private restQuats: Record<VRMHumanBoneName, THREE.Quaternion> = {} as any; 

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, modelUrl: string) {
    this.scene = scene;
    
    // 로더 설정 (KTX2Loader는 생략, 필수적이지 않다면 복잡도 증가 방지)
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));

    this.loader.load(
      modelUrl,
      (gltf) => {
        const vrmInstance = gltf.userData.vrm as VRM;
        VRMUtils.removeUnnecessaryJoints(vrmInstance.scene);
        vrmInstance.scene.scale.set(1, 1, 1);
        this.scene.add(vrmInstance.scene);
        this.vrm = vrmInstance;

        // **핵심 수정: T-Pose 쿼터니언 저장**
        // C#의 `InitRotation` 역할. 뼈대의 로컬 T-Pose 회전을 저장합니다.
        const bonesToStore: VRMHumanBoneName[] = [
          'hips','spine','chest','neck',
          'leftUpperArm','leftLowerArm','rightUpperArm','rightLowerArm',
          'leftUpperLeg','leftLowerLeg','rightUpperLeg','rightLowerLeg',
          'leftFoot', 'rightFoot' // 발 회전 추가
        ] as VRMHumanBoneName[];
        
        bonesToStore.forEach((boneName) => {
          const node = vrmInstance.humanoid!.getNormalizedBoneNode(boneName);
          if (node) {
            // **로컬 쿼터니언을 복제하여 저장**
            this.restQuats[boneName] = node.quaternion.clone(); 
          }
        });
      },
      undefined,
      (error) => {
        console.error('CharacterRenderer: VRM load error', error);
      }
    );
  }

  // 기존 update 함수는 Kalidokit을 사용하므로 제거하거나 updateBy3D로 통일합니다.
  public update(frame: {pose3D: Landmark[], pose2D: NormalizedLandmark[]}) {
    // 3D 랜드마크 데이터만 사용하여 SkeletonFrame 형식으로 변환합니다.
    const converted3D : SkeletonFrame = frame.pose3D.map((lm, index) => ({
      name: `lm${index}`, // 임시 이름
      position: [lm.x, lm.y, -lm.z], // CHECK!!!
      visibility: 1
    }));
    
    this.updateBy3D(converted3D);
  }

  // **3D 랜드마크를 직접 리깅하는 핵심 함수**
  public updateBy3D(frame: SkeletonFrame) {
    if (!this.vrm) return;
    const delta = this.clock.getDelta();

    // 1. 직접 리깅 로직 호출
    // frame: MediaPipe 3D 랜드마크 배열 (Z 반전이 된 상태)
    // this.restQuats: T-Pose의 쿼터니언을 포함 (C#의 InitRotation 역할)
    const rigQuats = directRig(frame, this.restQuats);

    const humanoid = this.vrm!.humanoid!;

    // CHECK!!! for debugging
    const torsoBones: VRMHumanBoneName[] = ['hips', 'spine', 'chest', 'neck', 'head', 'rightUpperArm', 'leftUpperArm']; // neck도 포함


    // 2. 계산된 회전값 적용
    // **회전 적용 공식 통일 및 몸통 격리**
    (Object.entries(rigQuats) as [VRMHumanBoneName, THREE.Quaternion][]).forEach(
      ([boneName, q_delta]) => {
        const node = humanoid.getNormalizedBoneNode(boneName);
        const q_rest = this.restQuats[boneName];

        if (node && q_rest && q_delta) {
          
          // for debugging
          if (torsoBones.includes(boneName)) {
              // 1. 몸통 관절: 표준 VRM/Animation 공식 적용
              // Q_final = Q_rest_initial * Q_delta
              node.quaternion.copy(q_rest.clone().multiply(q_delta)); 
          } else {
              // 2. 사지 관절: T-Pose 초기값 유지 (디버깅용)
              node.quaternion.copy(q_rest);
          }
          // for real
          // node.quaternion.copy(q_rest.clone().multiply(q_delta));
          
        }
      }
    );
    
    // **Hips 위치 적용** (캐릭터를 이동시키는 경우)
    const hipsLm = frame[34]; // pelvis
    const lFootLm = frame[31];
    const rFootLm = frame[32];
    if (hipsLm) {
        // GHUM 데이터는 보통 미터(meter) 단위입니다. VRM 모델이 작다면 스케일을 조정해야 합니다.
        const hipsNode = humanoid.getNormalizedBoneNode("hips");
        if (hipsNode) {
            const [hx, hy, hz] = hipsLm.position;
            const [lx, ly, lz] = lFootLm.position;
            const [rx, ry, rz] = rFootLm.position;

            const lowestFootY = Math.min(ly, ry);

            const hipsToFoot = hy - lowestFootY;

            hipsNode.position.set(1, hipsToFoot, 0);

            // hipsNode.position.set(hx, hipsToFoot, hz);
        }
    }
    
    // // ** 회전 적용 공식 수정 (Final Check) **
    // (Object.entries(rigQuats) as [VRMHumanBoneName, THREE.Quaternion][]).forEach(
    //     ([boneName, q_delta]) => {
    //         const node = humanoid.getNormalizedBoneNode(boneName);
    //         const q_rest = this.restQuats[boneName];

    //         if (node && q_rest && q_delta) {
    //             // T-Pose 초기 회전에 델타 회전(q_delta)을 곱하여 최종 로컬 회전을 얻습니다.
    //             // q_final = q_rest_initial * q_delta
    //             node.quaternion.copy(q_rest.clone().multiply(q_delta)); 
    //         }
    //     }
    // );
    
    this.vrm.update(delta);
  }
}