import { Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../routes/protected-routes";
import AppLayout from "../@crema/core/AppLayout";
import { routeConfig } from "./sample/route.config";

export const routes = [
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  ...routeConfig.map((route) => ({
    ...route,
    element: (
      <ProtectedRoute>
        <AppLayout>{route.element}</AppLayout>
      </ProtectedRoute>
    ),
  })),
];
