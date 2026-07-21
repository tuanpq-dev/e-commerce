import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  LoginPayload,
  RegisterPayload,
} from "../types/domain";

import openNotification from "../@crema/core/Notification";
import axios from "axios";
import axiosClient from "../api/axiosClient";

import { updateAuthProfileApi, type UpdateAuthDto } from "../api/authApi";

type User = {
  id: number | string;
  email: string;
  fullname: string;
  username: string;
  role: string;
  avatar: string;
  phone: string;
};

type AuthContextType = {
  userInfo: User | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => void;
  refreshUser: () => void;
  updateProfile: (id: number | string, payload: UpdateAuthDto) => Promise<any>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      setUserInfo(null);
      return;
    }

    try {
      const res = await axiosClient.get('auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // API /me trả về field `image`, User type dùng `avatar` — phải map thủ công
      setUserInfo(res ? {
        id: res.id,
        email: res.email ?? "",
        fullname: res.fullname ?? "",
        username: res.username ?? "",
        role: res.role ?? "",
        avatar: res.image ?? res.avatar ?? "",
        phone: res.phone ?? "",
      } : null);
    } catch (err) {
      console.error("Failed to refresh user info:", err);

      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      setUserInfo(null);
    }
  }, []);

  const getUserInfo = refreshUser;

  const login = async (payload: LoginPayload) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/auth/login",
        payload,
        { withCredentials: true },
      );
      const { accessToken, user } = await res.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", String(user.id));

      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("userId", String(user.id));

      await refreshUser();

      openNotification("success", {
        message: "Thành công",
        description: "Đăng nhập thành công",
      });
    } catch (err: unknown) {
      let finalMsg = "Đăng nhập thất bại";
      if (err && typeof err === "object") {
        const responseData = (
          err as { response?: { data?: { message?: string | string[] } } }
        ).response?.data;
        const errMsg = responseData?.message || (err as Error).message;
        finalMsg = Array.isArray(errMsg)
          ? errMsg.join(", ")
          : errMsg || finalMsg;
      } else if (err instanceof Error) {
        finalMsg = err.message;
      }
      throw new Error(finalMsg, { cause: err });
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/auth/register",
        payload,
      );

      openNotification("success", {
        message: "Thành công",
        description: res.data?.message || "Đăng ký tài khoản thành công",
      });
    } catch (err: unknown) {
      let finalMsg = "Đăng ký thất bại";
      if (err && typeof err === "object") {
        const responseData = (
          err as { response?: { data?: { message?: string | string[] } } }
        ).response?.data;
        const errMsg = responseData?.message || (err as Error).message;
        finalMsg = Array.isArray(errMsg)
          ? errMsg.join(", ")
          : errMsg || finalMsg;
      } else if (err instanceof Error) {
        finalMsg = err.message;
      }
      throw new Error(finalMsg, { cause: err });
    }
  };

  const logout = async () => {
    try {
      const res = await axios.post("http://localhost:3000/auth/logout", {
        withCredentials: true,
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");

      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userId");

      openNotification("success", {
        message: "Thành công",
        description: res.data.message,
      });
    } catch (err) {
      openNotification("error", {
        message: "Thất bại",
        description: "Đăng xuất thất bại, vui lòng thử lại!",
      });
    }
  };

  const updateProfile = async (id: number | string, payload: UpdateAuthDto) => {
    if (!id) {
      openNotification("error", {
        message: "Thất bại",
        description: "Không tìm thấy thông tin ID người dùng!",
      });
      throw new Error("User ID is missing");
    }

    try {
      const res = await updateAuthProfileApi(id, payload);
      const updatedData = res.data;

      setUserInfo((prev) => {
        const updated = {
          ...prev,
          id: updatedData.id ?? prev?.id ?? userId,
          email: updatedData.email ?? prev?.email ?? "",
          fullname: updatedData.fullname ?? prev?.fullname ?? "",
          phone: updatedData.phone ?? prev?.phone ?? "",
          avatar: updatedData.image ?? prev?.avatar ?? "",
          role: updatedData.role ?? prev?.role ?? "",
          username: prev?.username ?? "",
        } as User;

        localStorage.setItem("user", JSON.stringify(updated));
        sessionStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });

      openNotification("success", {
        message: "Thành công",
        description: res.message || "Cập nhật thông tin thành công!",
      });

      return res;
    } catch (err: unknown) {
      let finalMsg = "Cập nhật thông tin thất bại";
      if (typeof err === "string") {
        finalMsg = err;
      } else if (err && typeof err === "object") {
        const responseData = (
          err as { response?: { data?: { message?: string | string[] } } }
        ).response?.data;
        const errMsg = responseData?.message || (err as Error).message;
        finalMsg = Array.isArray(errMsg)
          ? errMsg.join(", ")
          : errMsg || finalMsg;
      } else if (err instanceof Error) {
        finalMsg = err.message;
      }

      openNotification("error", {
        message: "Thất bại",
        description: finalMsg,
      });

      throw new Error(finalMsg, { cause: err });
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        userInfo,
        getUserInfo,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
