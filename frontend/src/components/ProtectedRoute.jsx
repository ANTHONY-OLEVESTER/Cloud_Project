import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { token, logout } = useAuth();
  const location = useLocation();

  // Clear invalid "demo-token" and force re-authentication
  if (token === "demo-token") {
    logout();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
