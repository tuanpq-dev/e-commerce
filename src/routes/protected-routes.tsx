import { Navigate } from "react-router-dom";
import { getAccessToken } from "../api/mockApi";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = getAccessToken();

  if (!token) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
