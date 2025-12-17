import React, { useState } from "react";
import { t, useLang } from "../i18n";

interface VideoItem {
  id: number;
  title: string;
  date: string;
  score: number;
  url?: string;
}

export const MyVideosPage: React.FC = () => {
  useLang();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const videos: VideoItem[] = [
    { id: 1, title: "태극 1장 훈련 #1", date: "2025-11-20", score: 82 },
    { id: 2, title: "태극 2장 훈련 #2", date: "2025-11-21", score: 88 },
  ];

  const handleDownload = (video: VideoItem) => {
    console.log("download video", video);
    alert(t("videos.download.mock", { title: video.title }));
  };

  return (
    <div className="page videos-page">
      <h1>{t("videos.title")}</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>{t("videos.table.title")}</th><th>{t("videos.table.date")}</th><th>{t("videos.table.score")}</th><th>{t("videos.table.action")}</th></tr>
          </thead>
          <tbody>
            {videos.map(v=>(
              <tr key={v.id}>
                <td>{v.title}</td>
                <td>{v.date}</td>
                <td>{v.score}</td>
                <td>
                  <button className="btn-link" onClick={()=>setSelectedVideo(v)}>{t("videos.action.view")}</button>
                  <button className="btn-link" onClick={()=>handleDownload(v)}>{t("videos.action.download")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedVideo && (
        <div className="modal-backdrop" onClick={()=>setSelectedVideo(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h2>{selectedVideo.title}</h2>
            <p className="meta">{t("videos.modal.dateScore", { date: selectedVideo.date, score: selectedVideo.score })}</p>
            <div className="video-placeholder"><span>{t("videos.modal.preview")}</span></div>
            <button className="btn-secondary full-width" onClick={()=>setSelectedVideo(null)}>{t("videos.modal.close")}</button>
          </div>
        </div>
      )}
    </div>
  );
};


