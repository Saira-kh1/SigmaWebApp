
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthed, isGuest } = useAuth();
  const loc = useLocation();

  // Allow both registered users AND guests — only block totally unauthenticated users
  if (!isAuthed && !isGuest) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}