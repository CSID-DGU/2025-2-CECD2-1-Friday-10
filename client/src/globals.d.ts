declare module 'three/examples/jsm/loaders/GLTFLoader';

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader } from 'three';
  import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
  export class GLTFLoader extends Loader {
    constructor();
    load: (
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ) => void;
    register: (plugin: any) => void;
  }
  export type { GLTF };
}