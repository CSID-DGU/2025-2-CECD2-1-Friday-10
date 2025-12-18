import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Auth } from "../../auth";
import { t, useLang } from "../../i18n";

export const Header: React.FC = () => {
  const loggedIn = Auth.isLoggedIn();
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === "/";
  const onAdmin = location.pathname === "/admin";
  const showNav = loggedIn && !onHome && !onAdmin;
  const [_lang] = useLang();
  return (
    <header className="site-header">
      <div className={`header-inner ${showNav ? "stack" : "center"}`}>
        <Link to="/" className="logo">{t("brand")}</Link>
        {showNav && (
          <nav className="nav-grid">
            <NavLink to="/training" className={({isActive}) => `nav-cell${isActive ? " active" : ""}`}>{t("nav.training")}</NavLink>
            <NavLink to="/videos" className={({isActive}) => `nav-cell${isActive ? " active" : ""}`}>{t("nav.videos")}</NavLink>
            <NavLink to="/profile" className={({isActive}) => `nav-cell${isActive ? " active" : ""}`}>{t("nav.profile")}</NavLink>
            <button
              className="nav-cell nav-logout"
              onClick={() => { Auth.logout(); navigate("/", { replace: true }); }}
            >
              {t("nav.logout")}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};


