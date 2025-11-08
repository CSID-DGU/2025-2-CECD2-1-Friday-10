// src/components/CaptureController.tsx

import { useEffect, useRef, useState } from 'react';
import { SkeletonCaptureGhum } from '../core/adapter/SkeletonCaptureGhum';
import { DataProvider } from '../core/DataProvider';
import SkeletonViewer from './SkeletonViewer';
import type { DataProvider as DataProviderType } from '../core/DataProvider';

export default function CaptureController() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [provider, setProvider] = useState<DataProviderType | null>(null);

  // 'stream' 또는 'video' 모드를 토글하기 위한 상태
  const [mode, setMode] = useState<'stream' | 'video'>('video');
  // 업로드된 파일의 로컬 URL
  const [videoURL, setVideoURL] = useState<string | null>(null);

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ──  기존 웹캠 스트림 해제  ──
    if (videoRef.current?.srcObject instanceof MediaStream) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }

    // 업로드된 파일을 로컬 URL로 만들고 모드 전환
    if (videoURL) URL.revokeObjectURL(videoURL);
    const url = URL.createObjectURL(file);
    setVideoURL(url);
    setMode('video');
  };

  useEffect(() => {
    if (!videoRef.current) return;
    const adapter = new SkeletonCaptureGhum(
      videoRef.current,
      mode,
      mode === 'video' ? videoURL! : undefined
    );

    const dataProvider = new DataProvider(adapter);
    setProvider(dataProvider);

    dataProvider?.on2DFrame((lms) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // 해상도 맞추기
      canvas.width  = videoRef.current!.videoWidth;
      canvas.height = videoRef.current!.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      lms.forEach(({x,y}) => {
        ctx.beginPath();
        ctx.arc(x * canvas.width, y * canvas.height, 5, 0, 2*Math.PI);
        ctx.fill();
      });
    })

    
    // adapter.onFrame((frame) => {
    //   console.log("onFrame?")
    //   if (recordingRef.current) recordedFrames.current.push(frame);
    // })

    adapter.init().then(() => adapter.play());

    // cleanup: 컴포넌트 언마운트 시 adapter 루프 정리
    return () => {
      adapter.pause();
      setProvider(null);
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [mode, videoURL]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
      {/* 2) 비디오 뷰어 */}
      <div style={{ position: 'relative', width: 640, height: 480 }}>
        <input type="file" accept="video/*" onChange={handleFileChange} />
        {videoURL && (
        <button onClick={() => setMode('stream')}>
         웹캠으로 돌아가기
        </button>
        )}

        <video
          loop
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', border: '1px solid gray' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 90, left: 0,
            width: '100%', height: '80%', pointerEvents: 'none'
          }}
        />
      </div>

      {/* 3) 3D 스켈레톤 뷰어 */}
      {provider && (
        <div style={{ width: 800, height: 600 }}>
          <SkeletonViewer provider={provider} width={800} height={600} />
        </div>
      )}
    </div>
  );
}
