import React, { useEffect, useRef, useState } from "react";
import { t, useLang } from "../i18n";

import { SkeletonCaptureGhum } from '../core/adapter/SkeletonCaptureGhum';
import { DataProvider } from '../core/DataProvider';
import SkeletonViewer from "../components/SkeletonViewer";
import type { DataProvider as DataProviderType } from '../core/DataProvider';

type TrainingTab = "capture" | "analysis";

interface UploadedFile {
  id: number;
  name: string;
  uploadedAt: string;
}
interface AnalysisRecord { id: number; label: string; }
interface AnalysisMetric { name: string; score: number; }

export const TrainingPage: React.FC = () => {
  useLang();
  const [activeTab, setActiveTab] = useState<TrainingTab>("capture");
  const [isRecording, setIsRecording] = useState(false);
  const [viewMode, setViewMode] = useState<"Skeleton" | "Character">("Character");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fileCounter, setFileCounter] = useState(1);

  const [mode, setMode] = useState<'stream' | 'video'>('video');

  const [provider, setProvider] = useState<DataProviderType | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackLabel, setTrackLabel] = useState<string>("");

  const [videoURL, setVideoURL] = useState<string | null>(null);

  const [selectedPoomsae, setSelectedPoomsae] = useState("taeguk1");
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<AnalysisMetric[] | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  const mockRecords: AnalysisRecord[] = [
    { id: 1, label: "2025-11-20 #1" },
    { id: 2, label: "2025-11-21 #2" },
  ];

  const handleStartRecording = () => { console.log("Start recording..."); setIsRecording(true); };
  const handleStopRecording = () => { console.log("Stop recording..."); setIsRecording(false); };
  const handleSaveRecording = () => { console.log("Saved mock file"); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFiles(prev => [...prev, { id: fileCounter, name: file.name, uploadedAt: new Date().toLocaleString() }]);
    setFileCounter(n => n + 1);
    console.log("Uploaded:", file.name);

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

  const handleRunAnalysis = () => {
    if (!selectedRecordId) { alert("훈련 기록을 선택하세요"); return; }
    const mock: AnalysisMetric[] = [
      { name: "자세안정도", score: 85 },
      { name: "균형", score: 78 },
      { name: "속도", score: 88 },
      { name: "동작 일관성", score: 82 },
    ];
    const avg = Math.round(mock.reduce((s,m)=>s+m.score,0)/mock.length);
    setMetrics(mock); setTotalScore(avg);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(t("training.camera.unsupported"));
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // 일부 브라우저는 메타데이터 로드 후에 play()가 가능합니다
        const videoEl = videoRef.current;
        const onLoaded = async () => {
          try {
            videoEl.muted = true;
            await videoEl.play();
          } catch (e) {
            console.warn("video.play() blocked:", e);
          }
          videoEl.removeEventListener("loadedmetadata", onLoaded);
        };
        videoEl.addEventListener("loadedmetadata", onLoaded);
      }
      const label = stream.getVideoTracks()[0]?.label || "";
      setTrackLabel(label);
      setCameraOn(true);
      setMode("stream");
    } catch (err: any) {
      console.error(err);
      setCameraError(err?.message || t("training.camera.noAccess"));
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } finally {
      setCameraOn(false);
    }
  };

  // useEffect(() => {
  //   return () => {
  //     stopCamera();
  //   };
  // }, []);

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

      // ctx.fillStyle = 'cyan';
      // ctx.font = '70px Arial';
      // ctx.fillText('몸통 지르기', 1300, 100);
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
    <div className="page training-page">
      <h1>{t("training.title")}</h1>
      <div className="tabs">
        <button className={`tab-btn ${activeTab==='capture'?'active':''}`} onClick={()=>setActiveTab("capture")}>{t("training.tab.capture")}</button>
        <button className={`tab-btn ${activeTab==='analysis'?'active':''}`} onClick={()=>setActiveTab("analysis")}>{t("training.tab.analysis")}</button>
      </div>
      {activeTab === "capture" ? (
        <div className="capture-layout">
          <div className="capture-left">
            {/* 카메라 미리보기 */}
            <section className="card">
              <div className="viewer-header">
                <h2>{t("training.camera.title")}</h2>
              </div>
              <div className="viewer-area">
                {/* {cameraOn ||  ? (
                  <>
                    <video ref={videoRef} className="viewer-video" autoPlay playsInline muted />
                    {trackLabel && <p className="meta">{`Device: ${trackLabel}`}</p>}
                  </>
                ) : (
                  <div className="viewer-placeholder"><span>{t("training.camera.off")}</span></div>
                )} */}
                <div style={{ position: 'relative', width: 600, height: 450 }}>
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
                      position: 'absolute', top: 45, left: 0,
                      width: '100%', height: '80%', pointerEvents: 'none'
                    }}
                  />
                  </div>
                {cameraError && <p className="meta">{cameraError}</p>}
              </div>
            </section>
            {/* 스켈레톤 뷰어 */}
            <section className="card">
              <div className="viewer-header">
                <h2>{t("training.viewer.title")}</h2>
                <div className="view-mode-switch">
                  <label><input type="radio" checked={viewMode==='Skeleton'} onChange={()=>setViewMode('Skeleton')} /> Skeleton </label>
                  <label><input type="radio" checked={viewMode==='Character'} onChange={()=>setViewMode('Character')} /> Character</label>
                </div>
              </div>
              {/* TODO: Skeleton */}
              {provider && (
                <div style={{ width: 800, height: 600 }}>
                  <SkeletonViewer provider={provider} width={800} height={600} />
                </div>
              )}
            </section>
          </div>
          <section className="capture-controls card">
            <h2>{t("training.record.status")}</h2>
            <div className="button-group">
              <button className="btn-primary" onClick={startCamera} disabled={cameraOn}>{t("training.camera.btnOn")}</button>
              <button className="btn-secondary" onClick={stopCamera} disabled={!cameraOn}>{t("training.camera.btnOff")}</button>
            </div>
            <p>{t("training.record.status")}: <strong>{isRecording ? t("training.record.recording") : t("training.record.idle")}</strong></p>
            <div className="button-group">
              <button className="btn-primary" onClick={handleStartRecording} disabled={isRecording}>{t("training.record.start")}</button>
              <button className="btn-secondary" onClick={handleStopRecording} disabled={!isRecording}>{t("training.record.stop")}</button>
            </div>
            <button className="btn-outline full-width" onClick={handleSaveRecording}>{t("training.save.mock")}</button>
            <hr />
            <h3>{t("training.upload.title")}</h3>
            <input type="file" onChange={handleFileUpload} />
            <ul className="file-list">
              {files.map(f => (<li key={f.id}><span>{f.name}</span><span className="meta">{f.uploadedAt}</span></li>))}
              {files.length===0 && <li className="meta">{t("training.upload.empty")}</li>}
            </ul>
          </section>
        </div>
      ) : (
        <div className="analysis-layout">
          <section className="card analysis-controls">
            <h2>{t("training.analysis.title")}</h2>
            <div className="form-row">
              <label>{t("training.analysis.poomsae")}
                <select value={selectedPoomsae} onChange={(e)=>setSelectedPoomsae(e.target.value)}>
                  <option value="taeguk1">Taeguk 1</option>
                  <option value="taeguk2">Taeguk 2</option>
                  <option value="taeguk3">Taeguk 3</option>
                </select>
              </label>
              <label>{t("training.analysis.record")}
                <select value={selectedRecordId ?? ""} onChange={(e)=>setSelectedRecordId(Number(e.target.value) || null)}>
                  <option value="">{t("training.analysis.choose")}</option>
                  {mockRecords.map(r => (<option key={r.id} value={r.id}>{r.label}</option>))}
                </select>
              </label>
            </div>
            <button className="btn-primary" onClick={handleRunAnalysis}>{t("training.analysis.run")}</button>
          </section>
          <section className="card analysis-result">
            <h2>{t("training.result.title")}</h2>
            {totalScore !== null && metrics ? (
              <>
                <p className="total-score">{t("training.result.total")}: <strong>{totalScore}</strong> / 100</p>
                <table className="metrics-table">
                  <thead><tr><th>{t("training.result.table.metric")}</th><th>{t("training.result.table.score")}</th><th>{t("training.result.table.graph")}</th></tr></thead>
                  <tbody>
                    {metrics.map(m=>(
                      <tr key={m.name}>
                        <td>{m.name}</td>
                        <td>{m.score}</td>
                        <td><div className="bar-wrapper"><div className="bar-fill" style={{width:`${m.score}%`}}/></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (<p className="meta">{t("training.result.empty")}</p>)}
          </section>
        </div>
      )}
    </div>
  );
};


