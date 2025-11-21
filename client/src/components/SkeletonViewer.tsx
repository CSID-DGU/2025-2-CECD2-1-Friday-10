// components/SkeletonViewer.tsx

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DataProvider } from "../core/DataProvider";
import { SkeletonRenderer } from "../renderer/SkeletonRenderer";
import { SkeletonLineRenderer } from "../renderer/SkeletonLineRenderer"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CharacterRenderer } from "../renderer/CharacterRenderer";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

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
    camera.position.set(0, 1.4, 1.5);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 2, 3);
    dir.castShadow = true;
    scene.add(ambient, dir);

    // WebGLRenderer
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountTarget?.appendChild(renderer.domElement);

    renderer.setClearColor(0xDDDDDD);
    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);

    const exrLoader = new EXRLoader();
    exrLoader.load("/models/resting_place_1k.exr", function (texture) {
      // 텍스처 매핑을 구형(Equirectangular) 방식으로 설정
      texture.mapping = THREE.EquirectangularReflectionMapping;

      // 1. 모델에 반사광 제공
      scene.environment = texture; 
      
      // 2. 배경 이미지로도 사용 (선택 사항)
      scene.background = texture;
    });

    // for develope axes helper
    const axesHelper = new THREE.AxesHelper(3)
    scene.add(axesHelper)

    // floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.2,
      roughness: 1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();
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
      characterRenderer.update(frame);
    })

    provider.on3DFrame?.((frame) => {
      // skeletonRenderer.update(frame);
      // lineRenderer.update(frame);
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
