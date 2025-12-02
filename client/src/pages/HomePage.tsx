import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../auth";
import { t, useLang } from "../i18n";
import { LanguageSelector } from "../components/LanguageSelector";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  // subscribe to language change for re-render
  useLang();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) return;
    try {
      const user = Auth.login(account, password);
      if (!user) {
        alert(t("error.login.invalid"));
        return;
      }
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/training", { replace: true });
      }
    } catch (err: any) {
      alert(err?.message || t("error.login.fail"));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password || !email || !email.includes("@")) return;
    try {
      const user = Auth.register(account, password, email);
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/training", { replace: true });
      }
    } catch (err: any) {
      alert(err?.message || t("error.register.fail"));
    }
  };

  return (
    <div className="page home-page">
      <div className="landing-layout">
        <div className="landing-left">
          <section className="card benefit-card">
            <h1 style={{marginBottom:10}}>{t("home.advantages.title")}</h1>
            <div className="benefit-grid">
              <div className="benefit-item">
                <span className="b-bullet" />
                <div className="b-text">
                  <div className="b-title">{t("home.advantages.1")}</div>
                  <div className="meta">{t("home.tech.point4")}</div>
                </div>
              </div>
              <div className="benefit-item">
                <span className="b-bullet" />
                <div className="b-text">
                  <div className="b-title">{t("home.advantages.2")}</div>
                  <div className="meta">{t("home.tech.point1")}</div>
                </div>
              </div>
              <div className="benefit-item">
                <span className="b-bullet" />
                <div className="b-text">
                  <div className="b-title">{t("home.advantages.3")}</div>
                  <div className="meta">{t("home.tech.point3")}</div>
                </div>
              </div>
            </div>
          </section>
          <section className="card benefit-card">
            <h2>{t("home.tech.title")}</h2>
            <div className="tech-layout">
              <div className="tech-desc">
                <p className="meta" style={{fontSize: 14}}>{t("home.tech.p1")}</p>
                <p className="meta" style={{fontSize: 14}}>{t("home.tech.p2")}</p>
              </div>
              <ul className="tech-list">
                <li>{t("home.tech.point1")}</li>
                <li>{t("home.tech.point2")}</li>
                <li>{t("home.tech.point3")}</li>
                <li>{t("home.tech.point4")}</li>
              </ul>
            </div>
          </section>
        </div>
        <div className="landing-right">
          <section className="card auth-panel">
            <div className="tabs">
              <button className={`tab-btn ${tab==='login'?'active':''}`} onClick={()=>setTab('login')}>{t("home.tabs.login")}</button>
              <button className={`tab-btn ${tab==='register'?'active':''}`} onClick={()=>setTab('register')}>{t("home.tabs.register")}</button>
            </div>
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="form">
                <label>{t("home.form.account")}
                  <input type="text" value={account} onChange={(e)=>setAccount(e.target.value)} placeholder={t("home.form.account.placeholder")} />
                </label>
                <label>{t("home.form.password")}
                  <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={t("home.form.password.placeholder")} />
                </label>
                <button type="submit" className="btn-primary full-width">{t("home.form.login.submit")}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="form">
                <label>{t("home.form.register.account")}
                  <input type="text" value={account} onChange={(e)=>setAccount(e.target.value)} placeholder={t("home.form.register.account")} />
                </label>
                <label>{t("home.form.register.email")}
                  <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="example@mail.com" />
                </label>
                <label>{t("home.form.register.password")}
                  <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={t("home.form.register.password")} />
                </label>
                <button type="submit" className="btn-primary full-width">{t("home.form.register.submit")}</button>
              </form>
            )}
            <hr style={{border:'none', borderTop:'1px solid #e5e7eb', margin:'14px 0'}} />
            <div className="social-row">
              <button className="btn-kakao" type="button" onClick={()=>alert(t("home.social.kakao") + " (demo)")}>{t("home.social.kakao")}</button>
              <button className="btn-google" type="button" onClick={()=>alert(t("home.social.google") + " (demo)")}>{t("home.social.google")}</button>
            </div>
            <p className="meta" style={{marginTop:8}}>{t("home.social.note")}</p>
          </section>
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
};


