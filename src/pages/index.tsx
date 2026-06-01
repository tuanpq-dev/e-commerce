import { Navigate } from "react-router-dom";
import { samplePageConfig } from "./sample";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../routes/protected-routes";
import AppLayout from "../@crema/core/AppLayout";

export const routes = [
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  ...samplePageConfig.map((route) => ({
    ...route,
    element: (
      <ProtectedRoute>
        <AppLayout>{route.element}</AppLayout>
      </ProtectedRoute>
    ),
  })),
];
