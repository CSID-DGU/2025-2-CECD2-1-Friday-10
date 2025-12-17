// src/core/adapter/IDataAdapter.ts
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { SkeletonFrame } from '../types';

export interface IDataAdapter {
  
  init(): Promise<void>;
  play(): void;
  pause(): void;

  onFrame?(callback: (frame: {pose3D: Landmark[], pose2D: NormalizedLandmark[]}) => void): void;
  on3DFrame?(callback: (frame: SkeletonFrame) => void): void;
  on2DFrame?(callback: (landmarks: NormalizedLandmark[]) => void): void;
}