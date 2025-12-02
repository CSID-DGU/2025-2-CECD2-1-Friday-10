import { t, useLang } from "../../i18n";
import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* subscribe to lang changes */}
        {useLang()[0] && null}
        <span>© {new Date().getFullYear()} {t("footer.copyrightBrand")}</span>
        <span>{t("footer.powered")}</span>
      </div>
    </footer>
  );
};


