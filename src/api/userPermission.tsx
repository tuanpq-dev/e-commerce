import { useAuth } from "../contexts/AuthContext";

export const UserPermission = () => {
  const { userInfo } = useAuth();
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (!userInfo || !token) {
    return { isAdmin: false };
  }

  const isAdmin = userInfo?.role === "admin";

  return { isAdmin };
};
