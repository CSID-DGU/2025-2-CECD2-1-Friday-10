import React, { useMemo, useState } from "react";
import { Auth } from "../auth";
import { t, useLang } from "../i18n";

type MenuKey = "profile" | "training" | "courses" | "videos" | "plans" | "ai";

type VideoItem = { id: number; title: string; date: string; score?: number };
type Plan = { id: number; title: string; targetMinutesPerWeek: number; reminder?: string };
type AIItem = { id: number; date: string; score: number; tips: string[] };

const STORAGE_VIDEOS = "me.videos";
const STORAGE_PLANS = "me.plans";
const STORAGE_PREF = "me.pref";

export const ProfilePage: React.FC = () => {
  useLang();
  const user = Auth.getUser();
  const [active, setActive] = useState<MenuKey>("profile");
  const [videos, setVideos] = useState<VideoItem[]>(
    () => JSON.parse(localStorage.getItem(STORAGE_VIDEOS) || "[]")
  );
  const [plans, setPlans] = useState<Plan[]>(
    () => JSON.parse(localStorage.getItem(STORAGE_PLANS) || "[]")
  );
  const [pref, setPref] = useState<{ favorite: string; level: number }>(
    () => JSON.parse(localStorage.getItem(STORAGE_PREF) || '{"favorite":"Poomsae","level":2}')
  );

  const totalWeekMinutes = 240; // mock
  const completedWeekMinutes = 150; // mock
  const completion = Math.round((completedWeekMinutes / totalWeekMinutes) * 100);

  const aiHistory: AIItem[] = useMemo(
    () => [
      { id: 1, date: "2025-11-18", score: 86, tips: ["收腹立身，保持躯干稳定", "步伐衔接更流畅", "出击时肩部放松"] },
      { id: 2, date: "2025-11-20", score: 90, tips: ["视线稳定", "打击节奏更均匀"] },
      { id: 3, date: "2025-11-21", score: 88, tips: ["支撑脚稳定", "髋部转动更充分"] },
    ],
    []
  );

  const addPlan = (title: string, minutes: number, reminder?: string) => {
    const p: Plan = { id: Date.now(), title, targetMinutesPerWeek: minutes, reminder };
    const next = [...plans, p];
    setPlans(next);
    localStorage.setItem(STORAGE_PLANS, JSON.stringify(next));
  };
  const removePlan = (id: number) => {
    const next = plans.filter(p => p.id !== id);
    setPlans(next);
    localStorage.setItem(STORAGE_PLANS, JSON.stringify(next));
  };

  const onUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const item: VideoItem = { id: Date.now(), title: f.name, date: new Date().toLocaleDateString() };
    const next = [item, ...videos];
    setVideos(next);
    localStorage.setItem(STORAGE_VIDEOS, JSON.stringify(next));
  };
  const deleteVideo = (id: number) => {
    const next = videos.filter(v => v.id !== id);
    setVideos(next);
    localStorage.setItem(STORAGE_VIDEOS, JSON.stringify(next));
  };

  const savePref = (favorite: string, level: number) => {
    const next = { favorite, level };
    setPref(next);
    localStorage.setItem(STORAGE_PREF, JSON.stringify(next));
  };

  return (
    <div className="page profile-page">
      <div className="profile-header card">
        <div className="avatar">{user?.account?.slice(0, 1).toUpperCase()}</div>
        <div className="ph-info">
          <h1>{t("profile.title")}</h1>
          <div className="ph-meta">
            <span>{t("profile.info.account")}: {user?.account}</span>
            {user?.email && <span>{t("profile.info.email")}: {user.email}</span>}
            <span>{t("profile.info.rank")}: <strong className="belt">{pref.level}</strong></span>
          </div>
          <div className="belt-bar">
            {[1,2,3,4,5].map(n=>(
              <div key={n} className={`belt-seg ${n<=pref.level?"on":""}`}/>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-menu card">
          <button className={`pm-item ${active==="profile"?"active":""}`} onClick={()=>setActive("profile")}>{t("profile.menu.profile")}</button>
          <button className={`pm-item ${active==="training"?"active":""}`} onClick={()=>setActive("training")}>{t("profile.menu.training")}</button>
          <button className={`pm-item ${active==="courses"?"active":""}`} onClick={()=>setActive("courses")}>{t("profile.menu.courses")}</button>
          <button className={`pm-item ${active==="videos"?"active":""}`} onClick={()=>setActive("videos")}>{t("profile.menu.videos")}</button>
          <button className={`pm-item ${active==="plans"?"active":""}`} onClick={()=>setActive("plans")}>{t("profile.menu.plans")}</button>
          <button className={`pm-item ${active==="ai"?"active":""}`} onClick={()=>setActive("ai")}>{t("profile.menu.ai")}</button>
        </aside>

        <section className="profile-content">
          {active === "profile" && (
            <div className="card">
              <h2>{t("profile.menu.profile")}</h2>
              <div className="grid-2">
                <div>
                  <label className="meta">{t("profile.info.favorite")}</label>
                  <select value={pref.favorite} onChange={(e)=>savePref(e.target.value, pref.level)}>
                    <option value="Poomsae">Poomsae</option>
                    <option value="Sparring">Sparring</option>
                    <option value="Basic">Basic</option>
                  </select>
                </div>
                <div>
                  <label className="meta">{t("profile.info.rankInput")}</label>
                  <input type="number" min={1} max={5} value={pref.level} onChange={(e)=>savePref(pref.favorite, Number(e.target.value))}/>
                </div>
              </div>
            </div>
          )}

          {active === "training" && (
            <div className="card">
              <h2>{t("profile.training.title")}</h2>
              <div className="kpi-row">
                <div className="kpi">
                  <div className="kpi-title">{t("profile.training.kpi1")}</div>
                  <div className="kpi-value">{completedWeekMinutes} min / {totalWeekMinutes} min</div>
                  <div className="bar-wrapper"><div className="bar-fill" style={{width:`${completion}%`}}/></div>
                </div>
                <div className="kpi">
                  <div className="kpi-title">{t("profile.training.kpi2")}</div>
                  <div className="kpi-value">88</div>
                </div>
                <div className="kpi">
                  <div className="kpi-title">{t("profile.training.kpi3")}</div>
                  <div className="kpi-value">{completion}%</div>
                </div>
              </div>
              <p className="meta">{t("profile.training.note")}</p>
            </div>
          )}

          {active === "courses" && (
            <div className="card">
              <h2>{t("profile.courses.title")}</h2>
              <table className="table">
                <thead><tr><th>{t("profile.courses.header.course")}</th><th>{t("profile.courses.header.progress")}</th><th>{t("profile.courses.header.next")}</th></tr></thead>
                <tbody>
                  <tr><td>태극 1장</td><td>100%</td><td>태극 2장</td></tr>
                  <tr><td>기본기(보법)</td><td>60%</td><td>보법 심화</td></tr>
                  <tr><td>체력/유연</td><td>70%</td><td>코어 강화</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {active === "videos" && (
            <div className="card">
              <h2>{t("profile.videos.title")}</h2>
              <input type="file" onChange={onUploadVideo}/>
              <table className="table" style={{marginTop:10}}>
                <thead><tr><th>{t("profile.videos.header.title")}</th><th>{t("profile.videos.header.date")}</th><th>{t("profile.videos.header.score")}</th><th>{t("profile.videos.header.action")}</th></tr></thead>
                <tbody>
                  {videos.map(v => (
                    <tr key={v.id}>
                      <td>{v.title}</td>
                      <td>{v.date}</td>
                      <td>{v.score ?? "-"}</td>
                      <td>
                        <button className="btn-link" onClick={()=>alert("preview")}>{t("profile.videos.play")}</button>
                        <button className="btn-link" onClick={()=>alert("download")}>{t("profile.videos.download")}</button>
                        <button className="btn-link danger" onClick={()=>deleteVideo(v.id)}>{t("profile.videos.delete")}</button>
                      </td>
                    </tr>
                  ))}
                  {videos.length===0 && <tr><td colSpan={4} className="meta">{t("profile.videos.empty")}</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {active === "plans" && (
            <div className="card">
              <h2>{t("profile.plans.title")}</h2>
              <PlanForm onAdd={addPlan}/>
              <ul className="list">
                {plans.map(p=>(
                  <li key={p.id} className="list-item">
                    <div>
                      <div className="list-title">{p.title}</div>
                      <div className="meta">{t("profile.plans.itemMeta", { min: p.targetMinutesPerWeek, rem: p.reminder || "" })}</div>
                    </div>
                    <button className="btn-link danger" onClick={()=>removePlan(p.id)}>{t("profile.plans.delete")}</button>
                  </li>
                ))}
                {plans.length===0 && <li className="meta">{t("profile.plans.empty")}</li>}
              </ul>
            </div>
          )}

          {active === "ai" && (
            <div className="card">
              <h2>{t("profile.ai.title")}</h2>
              <table className="table">
                <thead><tr><th>{t("profile.ai.header.date")}</th><th>{t("profile.ai.header.score")}</th><th>{t("profile.ai.header.tips")}</th></tr></thead>
                <tbody>
                  {aiHistory.map(item=>(
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.score}</td>
                      <td>{item.tips.join("；")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const PlanForm: React.FC<{ onAdd:(title:string, minutes:number, reminder?:string)=>void }> = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState<number>(150);
  const [reminder, setReminder] = useState("");
  return (
    <form
      onSubmit={(e)=>{ e.preventDefault(); if(!title) return; onAdd(title, minutes, reminder || undefined); setTitle(""); }}
      className="form"
      style={{marginBottom:10}}
    >
      <div className="grid-3">
        <label>计划标题
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="例如：每周 3 次品势训练"/>
        </label>
        <label>每周目标分钟
          <input type="number" min={30} step={10} value={minutes} onChange={(e)=>setMinutes(Number(e.target.value))}/>
        </label>
        <label>提醒（可选）
          <input value={reminder} onChange={(e)=>setReminder(e.target.value)} placeholder="每晚 8 点提醒"/>
        </label>
      </div>
      <div style={{textAlign:"right", marginTop:6}}>
        <button className="btn-primary" type="submit">添加计划</button>
      </div>
    </form>
  );
};


