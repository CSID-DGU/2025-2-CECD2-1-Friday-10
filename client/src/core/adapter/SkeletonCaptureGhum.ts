// src/core/adapter/SkeletonCaptureGhum.ts

// import * as tf from '@tensorflow/tfjs-core';
// import '@tensorflow/tfjs-backend-webgl';   // WebGL 백엔드
// import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'; // WASM 설정
import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult, type Landmark, type NormalizedLandmark } from '@mediapipe/tasks-vision';

import type { SkeletonFrame } from '../types';
import type { IDataAdapter } from './IDataAdapter';


// await tf.setBackend('wasm');
// await tf.ready();

// tf.env().set('WASM_HAS_SIMD_SUPPORT', true);
// tf.wasm.setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.18.0/dist/');


// const detectorConfig = {
//   runtime: 'mediapipe' as const,
//   modelType: 'ghum-3d' as any,  // 타입 정의에 없어서 any로 단언
//   solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/',
//   enableSmoothing: true,
//   enableSegmentation: false,
// };

export type CaptureSourceType = 'stream' | 'video';

export class SkeletonCaptureGhum implements IDataAdapter {
  // private detector: PoseDetector | null = null;
  private landmarker: PoseLandmarker | null = null;
  private video: HTMLVideoElement;
  private sourceType: CaptureSourceType;
  private src?: string;
  private onFrameCallback: ((frame: {pose3D: Landmark[], pose2D: NormalizedLandmark[]}) => void) | null = null;
  private on3DFrameCallback: ((frame: SkeletonFrame) => void) | null = null;
  private on2DFrameCallback: ((landmarks: NormalizedLandmark[]) => void) | null = null;
  private rafId: number | null = null;
  private isPlaying = false;

  private prevLandmarks: Landmark[] | null = null;
  private prevNormalizedLandmarks: NormalizedLandmark[] | null = null;

  private smoothingAlpha = 0.8;   // [0..1], 클수록 더 부드러움

  constructor(videoElement: HTMLVideoElement, sourceType: CaptureSourceType, src?: string) {
    this.video = videoElement;
    this.sourceType = sourceType;
    this.src = src;
  }

  async init(): Promise<void> {
    // await tf.setBackend('webgl');
    // await tf.ready();
    // setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/');
  
    // // (2) WebGL 우선 시도, 실패 시 WASM으로 폴백
    // try {
    //   await tf.setBackend('wasm');
    //   await tf.ready();
    // } catch {
    //   await tf.setBackend('webgl');
    //   await tf.ready();
    // }
    
    // this.detector = await poseDetection.createDetector(
    //   poseDetection.SupportedModels.BlazePose,
    //   {
    //     runtime: 'mediapipe' as const,
    //     modelType: 'ghum-3d' as any,  // 타입 정의에 없어서 any로 단언
    //     solutionPath: '/mediapipe/pose/',
    //     enableSmoothing: true,
    //     enableSegmentation: false,
    //   }
    // );
    const visionFileset = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );

    // 3) PoseLandmarker 생성 (GHUM-3D 전체 포즈 모델)
    this.landmarker = await PoseLandmarker.createFromOptions(visionFileset, {
      baseOptions: {
        // Full 3D 포즈 모델(.task)은 GHUM-3D가 포함됨.
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
        delegate: 'GPU', // GPU가 없으면 'CPU'로...
      },
      runningMode: 'VIDEO',
      outputPoseWorldLandmarks: true, // GHUM-3D(월드 좌표) 활성화
      outputPoseRoi: false,
      numPoses: 1,
      minPoseDetectionConfidence: 0.6,     // default 0.5  
      minPosePresenceConfidence: 0.6,      // default 0.5  
      minTrackingConfidence: 0.6,          // default 0.5  
    });

    console.log('[Adapter.init] PoseLandmarker 인스턴스 생성 완료');

    if (this.sourceType === 'stream') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.video.srcObject = stream;
    } else if (this.sourceType === 'video' && this.src) {
      if (this.video.srcObject instanceof MediaStream) {
            (this.video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
             this.video.srcObject = null;
      }
      this.video.src = this.src;
      this.video.load(); // src 변경 후 load() 호출
    }

    // await this.video.play();
    await new Promise<void>((resolve) => {
      // loadedmetadata: 비디오의 메타데이터(비율, 프레임 크기 등) 로드 완료 시점
      const handler = () => {
        this.video.removeEventListener('loadedmetadata', handler);
        resolve();
      };
      this.video.addEventListener('loadedmetadata', handler);
    });

    // 5) 안정적으로 play 호출: AbortError
    try {
      await this.video.play();
    } catch (e) {
      console.warn('video.play() interrupted:', e);
    }
  }

  play(): void {
    this.isPlaying = true;
    this.loop();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  onFrame(callback: (frame: {pose3D: Landmark[], pose2D: NormalizedLandmark[]}) => void): void {
    this.onFrameCallback = callback;
  }
  on3DFrame(callback: (frame: SkeletonFrame) => void): void {
    this.on3DFrameCallback = callback;
  }
  
  on2DFrame(callback: (landmarks: NormalizedLandmark[]) => void): void {
     this.on2DFrameCallback = callback;
  }

  additionalPoints(frame: SkeletonFrame): SkeletonFrame {
    const lSh = frame[11];
    const rSh = frame[12];
    const lHp = frame[23];
    const rHp = frame[24];

    const neck = (lSh && rSh)
      ? {
          name: "neck", // 33
          position: [
            (lSh.position[0] + rSh.position[0]) / 2, (lSh.position[1] + rSh.position[1]) / 2, (lSh.position[2] + rSh.position[2]) / 2,
          ]
        }
      : null;
      const pelvis = (lHp && rHp)
      ? {
          name: "pelvis", // 34
          position: [ (lHp.position[0] + rHp.position[0]) / 2, (lHp.position[1] + rHp.position[1]) / 2, (lHp.position[2] + rHp.position[2]) / 2,
          ]
        }
      : null;

    const midspine = (neck && pelvis)
      ? {
          name: "midspine",  // 35
          position: [ (neck.position[0] + pelvis.position[0]) / 2, (neck.position[1] + pelvis.position[1]) / 2, (neck.position[2] + pelvis.position[2]) / 2,
          ]
        }
      : null;

      return frame.concat([neck, pelvis, midspine].filter((x): x is SkeletonFrame[0] => !!x));
  }

  filter3DLandmarks(landmarks: Landmark[]): Landmark[] {
    if(!this.prevLandmarks) {
      this.prevLandmarks = landmarks;
      return landmarks;
    }
    else {
      //filter
      const smoothed = landmarks.map((lm, i) => {
        const prev = this.prevLandmarks![i];
        const [cx, cy, cz] = [lm.x, lm.y, lm.z];
        const [px, py, pz] = [prev.x, prev.y, prev.z];

        const nx = this.smoothingAlpha * px + (1 - this.smoothingAlpha) * cx;
        const ny = this.smoothingAlpha * py + (1 - this.smoothingAlpha) * cy;
        const nz = this.smoothingAlpha * pz + (1 - this.smoothingAlpha) * cz;

        return { 
          x: nx, y: ny, z: nz,
          visibility: lm.visibility
        }
      })
      this.prevLandmarks = smoothed;
      return smoothed;
    }
  }

  filter2DLandmarks(landmarks: NormalizedLandmark[]): NormalizedLandmark[] {
    if(!this.prevNormalizedLandmarks) {
      this.prevNormalizedLandmarks = landmarks;
      return landmarks;
    }
    else {
      //filter
      const smoothed = landmarks.map((lm, i) => {
        const prev = this.prevNormalizedLandmarks![i];
        const [cx, cy, cz] = [lm.x, lm.y, lm.z];
        const [px, py, pz] = [prev.x, prev.y, prev.z];

        const nx = this.smoothingAlpha * px + (1 - this.smoothingAlpha) * cx;
        const ny = this.smoothingAlpha * py + (1 - this.smoothingAlpha) * cy;
        const nz = this.smoothingAlpha * pz + (1 - this.smoothingAlpha) * cz;

        return { 
          x: nx, y: ny, z: nz,
          visibility: lm.visibility
        }
      })
      this.prevNormalizedLandmarks = smoothed;
      return smoothed;
    }
  }

  private loop = async () => {
    // 1) 재생 중이 아니거나 landmarker가 준비되지 않았거나 비디오가 충분히 로드되지 않았으면 재귀 콜백
    if (!this.isPlaying || !this.landmarker || this.video.readyState < 2) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }
  
    // 2) PoseLandmarker로 3D(world) 랜드마크 추정
    const result = await this.landmarker.detectForVideo(
      this.video,
      performance.now()
    );

    const filteredResult = { 
      pose3D: this.filter3DLandmarks(result?.worldLandmarks[0]),
      pose2D: this.filter2DLandmarks(result?.landmarks[0])
    }

    // raw data
    if (filteredResult && this.onFrameCallback) {
      this.onFrameCallback(filteredResult);
    }

    // 2D
    if (filteredResult?.pose2D && filteredResult.pose2D.length > 0 && this.on2DFrameCallback) {
        this.on2DFrameCallback(filteredResult.pose2D);
    }
  
    // 3D
    const worldLandmarks = filteredResult?.pose3D;  // Landmark[][] | undefined
    if (worldLandmarks && worldLandmarks.length > 0 && this.on3DFrameCallback) {

      const frame: SkeletonFrame = worldLandmarks.map((lm) => ({
        name: '',                  // GHUM doesn’t supply a named joint, so leave blank
        position: [lm.x, -lm.y, -lm.z],
      }));

      // add 3 points
      const totalFrame = this.additionalPoints(frame);

      this.on3DFrameCallback(totalFrame);
    }
    // 4) 다음 프레임 루프 예약
    this.rafId = requestAnimationFrame(this.loop);
  };
}
