// src/core/DataProvider.ts
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { IDataAdapter } from './adapter/IDataAdapter';
import type { SkeletonFrame } from './types';

type FrameCallback  = (frame: {pose3D: Landmark[], pose2D: NormalizedLandmark[]}) => void;
type Frame3DCallback = (frame: SkeletonFrame) => void;
type Frame2DCallback = (landmarks: NormalizedLandmark[]) => void;

export class DataProvider {
  private adapter: IDataAdapter;

  constructor(adapter: IDataAdapter) {
    this.adapter = adapter;
  }

  async init() {
    await this.adapter.init();
  }
  
  onFrame(callback: FrameCallback) {
    this.adapter.onFrame(callback);
  }

  on3DFrame(callback: Frame3DCallback) {
    this.adapter.on3DFrame(callback);
  }

  on2DFrame(callback: Frame2DCallback) {
    this.adapter.on2DFrame(callback);
  }

  play() {
    if ('play' in this.adapter) {
      this.adapter.play();
    }
  }

  pause() {
    if ('pause' in this.adapter) {
      this.adapter.pause();
    }
  }
}
