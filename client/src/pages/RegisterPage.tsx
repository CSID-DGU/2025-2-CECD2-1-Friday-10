import React, { useState } from "react";
import { t, useLang } from "../i18n";

export const RegisterPage: React.FC = () => {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  useLang();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password || !email) {
      alert(t("error.form.missing"));
      return;
    }
    if (!email.includes("@")) {
      alert(t("error.email.invalid"));
      return;
    }
    console.log("Sign up:", { account, password, email });
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h2>{t("home.tabs.register")}</h2>
        <form onSubmit={handleRegister} className="form">
          <label>
            {t("home.form.register.account")}
            <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder={t("home.form.register.account")} />
          </label>
          <label>
            {t("home.form.register.password")}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("home.form.register.password")} />
          </label>
          <label>
            {t("home.form.register.email")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
          </label>
          <button type="submit" className="btn-primary full-width">{t("home.form.register.submit")}</button>
        </form>
      </div>
    </div>
  );
};


