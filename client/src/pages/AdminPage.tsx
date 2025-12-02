import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth, type StoredUser } from "../auth";
import { t, useLang } from "../i18n";

export const AdminPage: React.FC = () => {
  useLang();
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<StoredUser[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setUsers(Auth.getAllUsers());
  }, []);

  const filtered = users.filter(u => {
    const k = keyword.toLowerCase();
    return u.account.toLowerCase().includes(k) || (u.email || "").toLowerCase().includes(k);
  });
  const toggleRole = (id: number) => {
    const u = users.find(x=>x.id===id); if (!u) return;
    const role = u.role === "admin" ? "user" : "admin";
    Auth.updateUser(id, { role });
    setUsers(Auth.getAllUsers());
  };
  const toggleStatus = (id: number) => {
    const u = users.find(x=>x.id===id); if (!u) return;
    const status = u.status === "active" ? "blocked" : "active";
    Auth.updateUser(id, { status });
    setUsers(Auth.getAllUsers());
  };
  const deleteUser = (id: number) => {
    if (!window.confirm(t("admin.confirm.delete"))) return;
    Auth.deleteUser(id);
    setUsers(Auth.getAllUsers());
  };

  return (
    <div className="page admin-page">
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
        <h1>{t("admin.title")}</h1>
        <button className="btn-outline" onClick={()=>{ Auth.logout(); navigate("/", { replace: true }); }}>{t("admin.logout")}</button>
      </div>
      <div className="admin-toolbar">
        <input type="text" placeholder={t("admin.search.placeholder")} value={keyword} onChange={(e)=>setKeyword(e.target.value)} />
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>{t("admin.table.id")}</th><th>{t("admin.table.account")}</th><th>{t("admin.table.email")}</th><th>{t("admin.table.created")}</th><th>{t("admin.table.role")}</th><th>{t("admin.table.status")}</th><th>{t("admin.table.action")}</th></tr>
          </thead>
        <tbody>
          {filtered.map(u=>(
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.account}</td>
              <td>{u.email}</td>
              <td>{u.createdAt}</td>
              <td>{u.role==='admin'?t("admin.role.admin"):t("admin.role.user")}</td>
              <td>{u.status==='active'?t("admin.status.active"):t("admin.status.blocked")}</td>
              <td>
                <button className="btn-link" onClick={()=>toggleRole(u.id)}>{t("admin.action.toggleRole")}</button>
                <button className="btn-link" onClick={()=>toggleStatus(u.id)}>{u.status==='active'?t("admin.action.toggleBlock"):t("admin.action.unblock")}</button>
                <button className="btn-link danger" onClick={()=>deleteUser(u.id)}>{t("admin.action.delete")}</button>
              </td>
            </tr>
          ))}
          {filtered.length===0 && (<tr><td colSpan={7} className="meta">{t("admin.empty")}</td></tr>)}
        </tbody>
        </table>
      </div>
    </div>
  );
};


