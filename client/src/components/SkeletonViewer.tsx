// components/SkeletonViewer.tsx

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DataProvider } from "../core/DataProvider";
import { SkeletonRenderer } from "../renderer/SkeletonRenderer";
import { SkeletonLineRenderer } from "../renderer/SkeletonLineRenderer"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CharacterRenderer } from "../renderer/CharacterRenderer";

type Props = {
  provider: DataProvider;
  width?: number;
  height?: number;
};

export default function SkeletonViewer({ provider, width = 800, height = 600 }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const mountTarget = canvasRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 3);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 2, 3);
    scene.add(ambient, dir);

    // WebGLRenderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    mountTarget?.appendChild(renderer.domElement);

        renderer.setClearColor(0xaaaaaa);
    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);

    // for develope axes helper
    const axesHelper = new THREE.AxesHelper(3)
    scene.add(axesHelper)


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const skeletonRenderer = new SkeletonRenderer(scene);
    const lineRenderer = new SkeletonLineRenderer(scene);
    const characterRenderer = new CharacterRenderer(scene, renderer, "/models/VRM1_Constraint_Twist_Sample.vrm");

    // provider.on2DFrame?.((lm2d) => {
    //   characterRenderer.set2D(lm2d);
    // });

    // // subscribe to frame updates
    // provider.onFrame((frame) => {
    //   skeletonRenderer.update(frame);
    //   lineRenderer.update(frame);
    //   characterRenderer.update(frame);
    // });

    provider.onFrame?.((frame) => {
      // characterRenderer.update(frame);
    })

    provider.on3DFrame?.((frame) => {
      skeletonRenderer.update(frame);
      lineRenderer.update(frame);
      characterRenderer.updateBy3D(frame);
    })

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      renderer.dispose();
      if (mountTarget?.contains(renderer.domElement)) {
        mountTarget.removeChild(renderer.domElement);
      }
    };
  }, [provider, width, height]);

  return (
    <div>
      <div ref={canvasRef} />
      <button onClick={() => {
        if (isPlaying) provider.pause();
        else provider.play();
        setIsPlaying(!isPlaying);
      }}>
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
  
}
