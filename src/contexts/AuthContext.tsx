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
  UpdateUserPayload,
} from "../types/domain";
import {
  getUserInfoById,
  UploadAvatar,
  UpdateUser,
} from "../services/auth.service";

import openNotification from "../@crema/core/Notification";
import axios from "axios";

type User = {
  id: number | string;
  email: string;
  name: string;
  username: string;
  role: string;
  avatar: string;
};

type AuthContextType = {
  userInfo: User | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (payload: UpdateUserPayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  getUserInfo: () => void;
  refreshUser: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);

  const refreshUser = useCallback(() => {
    const res = getUserInfoById();

    setUserInfo(res ?? null);
  }, []);

  const getUserInfo = refreshUser;

  const login = async (payload: LoginPayload) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/auth/login",
        payload,
        { withCredentials: true },
      );
      const { accessToken, user } = res.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", String(user.id));

      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("userId", String(user.id));

      setUserInfo(user);

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

  const updateUser = async (payload: UpdateUserPayload) => {
    const res = UpdateUser(payload);

    if (!res.success || !res.user) return;

    setUserInfo(res.user);
  };

  const uploadAvatar = async (file: File) => {
    const res = await UploadAvatar(file);

    if (!res.success || !res.user) return;

    setUserInfo(res.user);
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
        updateUser,
        uploadAvatar,
        refreshUser,
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
