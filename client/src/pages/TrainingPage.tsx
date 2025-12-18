import React, { useEffect, useRef, useState } from "react";
import { t, useLang } from "../i18n";

import { SkeletonCaptureGhum } from '../core/adapter/SkeletonCaptureGhum';
import { DataProvider } from '../core/DataProvider';
import SkeletonViewer from "../components/SkeletonViewer";
import type { DataProvider as DataProviderType } from '../core/DataProvider';
import { TaekwonClassifier } from "../evaluation/TaekwonClassifier";

const MODEL_URL = '/model/tfjs_model_output_v2/model.json';

const CLASS_NAMES = [
  "기본 준비",
  "앞굽이하고 아래막고 지르기",
  "앞굽이하고 아래막기",
  "앞굽이하고 지르기",
  "앞서고 아래막기",
  "앞서고 안막기",
  "앞서고 얼굴막기",
  "앞서로 지르기",
  "앞차고 앞서고 지르기"
]

const POOMSAE = [
  "태극1장",
  "태극2장"
]

type TrainingTab = "capture" | "analysis";

interface UploadedFile {
  id: number;
  name: string;
  uploadedAt: string;
}
interface PredictionResult {
  action: string;
  probability: number;
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
  const [isTraining, setIsTraining] = useState(false);

  const [mode, setMode] = useState<'stream' | 'video'>('video');
  const [pause, setPause] = useState<'play' |'pause'>('play');

  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>({ action: "대기 중", probability: 0 });

  const [provider, setProvider] = useState<DataProviderType | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const classifierRef = useRef<TaekwonClassifier>(null);

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
  const handlePause = () => { setPause('pause') }
  const handlePlay = () => { setPause('play') }
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

  const startTraining = async () => {
    const classifier = new TaekwonClassifier(MODEL_URL, CLASS_NAMES);
    classifierRef.current = classifier;

    try {
      await classifier.loadModel();
    } catch (e) {
      console.error("Load error: ", e);
    }

    setIsTraining(true);
  }

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

    dataProvider?.on2DFrame(async (lms) => {
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

      if(isTraining && classifierRef.current) {
        const classifier = classifierRef.current;
        const result = await classifier.processFrame(lms);
    
        // ⭐ 수정: 결과가 null이 아닐 때만 상태 업데이트
        if (result !== null) { 
            setPredictionResult(result);
    }
      }
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
      {/* <h1>{t("training.title")}</h1> */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab==='capture'?'active':''}`} onClick={()=>setActiveTab("capture")}>{t("training.tab.capture")}</button>
        <button className={`tab-btn ${activeTab==='analysis'?'active':''}`} onClick={()=>setActiveTab("analysis")}>{t("training.tab.analysis")}</button>
      </div>
      {activeTab === "capture" ? (
        <div className="capture-layout-new">
          <div className="capture-module-new">
            

            <div className="capture-module-row">
              {/* 카메라 미리보기 */}
              <section className="card">
                <div className="viewer-header">
                  { (mode === "stream") ? (<h2>{t("training.camera.title")}</h2>) : (<h2>{t("training.video.title")}</h2>)}
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
                  <div style={{ position: 'relative', width: 400, height: 300 }}>
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
                        position: 'absolute', top: 30, left: 0,
                        width: '100%', height: '80%', pointerEvents: 'none'
                      }}
                    />
                    </div>
                  {cameraError && <p className="meta">{cameraError}</p>}
                </div>
              </section>
              <section className="card">
                <div className="viewer-header">
                  <h2>품새학습</h2>
                </div>
                {isTraining ? (
                  <div className="viewer-area">
                    <h3>현재 동작</h3>
                    <p>동작: <strong>{predictionResult?.action}</strong></p>
                    <p>일치: <strong>{predictionResult?.probability}</strong></p>

                  </div>
                ) : (
                  <div className="viewer-area">
                    <h3>품새 선택</h3>
                    <p>
                      <select>
                        {POOMSAE.map((name, index) => (
                          <option key={index} value={name}>{name}</option>
                        ))}
                      </select>
                    </p>
                    <button className="btn-primary" onClick={startTraining} disabled={isTraining}>{"Start"}</button>
                  </div>
                  
                )}
                
              </section>

            </div>
            {/* 스켈레톤 뷰어 */}
            <section className="card">
              <div className="viewer-header">
                <h2>{t("training.viewer.title")}</h2>
                
              </div>
              {/* TODO: Skeleton */}
              {provider && (
                <div style={{ width: 720, height: 480 }}>
                  <SkeletonViewer provider={provider} width={720} height={480} mode={viewMode} />
                </div>
              )}
              <div className="view-mode-switch" style={{ marginTop: '10px' }}>
                <label><input type="radio" checked={viewMode==='Skeleton'} onChange={()=>setViewMode('Skeleton')} /> Skeleton </label>
                <label><input type="radio" checked={viewMode==='Character'} onChange={()=>setViewMode('Character')} /> Character</label>
              </div>
            </section>
          </div>
          <section className="capture-controls card">
            {/* <h2>{t("training.record.status")}</h2> */}
            <div className="capture-controls-first">
              <div className="button-group" style={{ marginRight: '20px' }}>
                <button className="btn-primary" onClick={startCamera} disabled={cameraOn}>{t("training.camera.btnOn")}</button>
                <button className="btn-secondary" onClick={stopCamera} disabled={!cameraOn}>{t("training.camera.btnOff")}</button>
              </div>
              <p>{t("training.record.status")}: <strong>{isRecording ? t("training.record.recording") : t("training.record.idle")}</strong></p>
              { mode === "stream" ? (
                <div className="button-group" style={{ marginLeft: '15px' }}>
                  <button className="btn-primary" onClick={handleStartRecording} disabled={isRecording}>{t("training.record.start")}</button>
                  <button className="btn-secondary" onClick={handleStopRecording} disabled={!isRecording}>{t("training.record.stop")}</button>
                </div>
              ) : (
                <div className="button-group" style={{ marginLeft: '15px' }}>
                  <button className="btn-primary" onClick={handlePause} disabled={pause=='pause'}>Pause</button>
                  <button className="btn-secondary" onClick={handlePlay} disabled={pause=='play'}>Play</button>
                </div>
              )}
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


