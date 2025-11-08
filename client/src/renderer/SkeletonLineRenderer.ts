import * as THREE from 'three';
import type { SkeletonFrame } from '../core/types';
import { CONNECTIONS } from './SkeletonConnection';

export class SkeletonLineRenderer {
  private line: THREE.LineSegments;
  private positions: Float32Array;

  constructor(scene: THREE.Scene) {
    // 2점(segment) × 3좌표(x,y,z) × 연결수
    this.positions = new Float32Array(CONNECTIONS.length * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    this.line = new THREE.LineSegments(geometry, material);
    scene.add(this.line);
  }

  update(frame: SkeletonFrame) {
    for (let i = 0; i < CONNECTIONS.length; i++) {
      const [a, b] = CONNECTIONS[i];
      const pa = frame[a].position;
      const pb = frame[b].position;
      // segment i 시작점
      this.positions[i*6 + 0] = pa[0];
      this.positions[i*6 + 1] = pa[1];
      this.positions[i*6 + 2] = pa[2];
      // segment i 끝점
      this.positions[i*6 + 3] = pb[0];
      this.positions[i*6 + 4] = pb[1];
      this.positions[i*6 + 5] = pb[2];
    }
    // 버퍼 갱신 플래그
    (this.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose() {
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
  }
}