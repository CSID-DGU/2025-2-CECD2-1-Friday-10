import type { IDataAdapter } from './IDataAdapter';
import type { SkeletonFrame, Joint } from '../types';

export class CsvAdapter implements IDataAdapter {
  private url: string;
  private isPlaying = false;
  private frames: SkeletonFrame[] = [];
  private currentIndex = 0;
  private frameCallback: ((frame: SkeletonFrame) => void) | null = null;
  private fps = 30;
  private lastFrameTime = 0;

  constructor(url: string) {
    this.url = url;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastFrameTime = performance.now();
      this.loop(); // 재생 시작
    }
  }

  pause() {
    this.isPlaying = false;
  }

  async init(): Promise<void> {
    const res = await fetch(this.url);
    const text = await res.text();
    const lines = text.trim().split('\n');
    const header = lines[0].split(',');

    const jointNames: string[] = [];
    for (let i = 1; i < header.length; i += 3) {
      const name = header[i].replace(/_(x|y|z)$/, '');
      jointNames.push(name);
    }

    this.frames = lines.slice(1).map((line) => {
      const values = line.split(',').map(parseFloat);
      const joints: Joint[] = [];

      for (let i = 0; i < jointNames.length; i++) {
        const x = values[1 + i * 3];
        const y = values[1 + i * 3 + 1];
        const z = values[1 + i * 3 + 2];
        if ([x, y, z].some((v) => isNaN(v))) continue;

        joints.push({ name: jointNames[i], position: [x, y, z] });
      }

      return joints;
    });
  }

  onFrame(callback: (frame: SkeletonFrame) => void): void {
    this.frameCallback = callback;
  }

  private loop = () => {
    if (!this.isPlaying) return;

    const now = performance.now();
    const interval = 1000 / this.fps;

    if (now - this.lastFrameTime >= interval) {
      this.lastFrameTime = now;

      if (this.currentIndex < this.frames.length) {
        const frame = this.frames[this.currentIndex++];
        this.frameCallback?.(frame);
      } else {
        this.pause(); // 끝났으면 자동 정지
        return;
      }
    }

    requestAnimationFrame(this.loop);
  };
}
