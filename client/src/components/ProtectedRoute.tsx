import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Auth } from "../auth";

export const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const location = useLocation();
  if (!Auth.isLoggedIn()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};


