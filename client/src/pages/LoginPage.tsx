import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../auth";
import { t, useLang } from "../i18n";

export const LoginPage: React.FC = () => {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  useLang();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = Auth.login(account, password);
      if (!user) { alert(t("error.login.invalid")); return; }
      if (user.role === "admin") navigate("/admin", { replace: true });
      else navigate("/training", { replace: true });
    } catch (err: any) {
      alert(err?.message || t("error.login.fail"));
    }
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h2>{t("home.tabs.login")}</h2>
        <form onSubmit={handleLogin} className="form">
          <label>
            {t("home.form.account")}
            <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} />
          </label>
          <label>
            {t("home.form.password")}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary full-width">{t("home.form.login.submit")}</button>
        </form>
      </div>
    </div>
  );
};


