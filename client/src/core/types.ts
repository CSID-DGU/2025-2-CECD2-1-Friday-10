// core/types.ts
export interface Joint3D {
  name: string;
  position: [number, number, number]; // x, y, z
}

export interface Joint2D {
  name: string;
  position: [number, number]; // x, y
}

export type SkeletonFrame = Joint3D[];
