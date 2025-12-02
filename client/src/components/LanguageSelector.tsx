import React from "react";
import { getLang, setLang, useLang } from "../i18n";

export const LanguageSelector: React.FC = () => {
  const [lang] = useLang();
  const current = getLang();
  const btn = (code: "zh" | "en" | "ko", label: string) => (
    <button
      key={code}
      onClick={() => setLang(code)}
      className={`btn-outline ${current === code ? "active" : ""}`}
      style={{ borderRadius: 10 }}
    >
      {label}
    </button>
  );
  return (
    <div className="card" style={{ padding: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
      {btn("zh", "中文")}
      {btn("en", "English")}
      {btn("ko", "한국어")}
    </div>
  );
};


