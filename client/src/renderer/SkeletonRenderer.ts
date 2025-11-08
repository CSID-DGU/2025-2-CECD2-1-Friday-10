// src/renderer/SkeletonRenderer.ts
import * as THREE from 'three';
import type { SkeletonFrame } from '../core/types';

export class SkeletonRenderer {
  private scene: THREE.Scene;
  private points: THREE.Points | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(frame: SkeletonFrame) {
    // 기존 점 제거
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }

    const positions = new Float32Array(frame.length * 3);

    frame.forEach((joint, i) => {
      const x = joint.position[0];
      const y = joint.position[1];
      const z = joint.position[2];
      
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xac53d9,
      size: 0.03, // 스케일에 조정
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }
}
