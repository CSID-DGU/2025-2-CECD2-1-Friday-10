import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Auth } from "../auth";

export const AdminRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const location = useLocation();
  if (!Auth.isLoggedIn()) return <Navigate to="/" state={{ from: location }} replace />;
  if (!Auth.isAdmin()) return <Navigate to="/training" replace />;
  return children;
};


