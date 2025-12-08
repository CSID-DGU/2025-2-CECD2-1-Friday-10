// components/SkeletonRecorder.tsx

import { useEffect, useRef, useState } from "react";
import { DataProvider } from "../core/DataProvider";
import type { SkeletonFrame } from "../core/types";

type Props = {
  provider: DataProvider;
};

export default function SkeletonRecorder({ provider }: Props) {
  // const canvasRef = useRef<HTMLDivElement>(null);
  // const [isPlaying, setIsPlaying] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const recordedFrames = useRef<SkeletonFrame[]>([]);

  const toggleRecording = () => {
    const next = !isRecording;
    setIsRecording(next);          // 클릭 직후 ref에 반영
    if (next) recordedFrames.current = []; // 시작할 때 버퍼 클리어
    setIsRecording(next);                 // UI용 state 업데이트
  };

  useEffect(() => {
    // subscribe to frame updates
    provider.on3DFrame((frame) => {
      if(isRecording) recordedFrames.current.push(frame);
    });
  }, [provider, isRecording]);

  const downloadCSV = () => {
    if (recordedFrames.current.length === 0) return alert('저장된 프레임이 없습니다.');
    // 헤더: jointName_x,jointName_y,jointName_z,...
    const header = recordedFrames.current[0]
      .map((j) => [j.name + '_x', j.name + '_y', j.name + '_z'])
      .flat()
      .join(',');
    // 각 프레임마다 values
    const rows = recordedFrames.current.map((frame) =>
      frame.map((j) => j.position.join(',')).flat().join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `skeleton_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ marginTop: 16}}>
      <button onClick={toggleRecording}>
        {isRecording ? '녹화 중지' : '녹화 시작'}
      </button>
      <button onClick={downloadCSV}>
        저장
      </button>
    </div>
  )
}
