import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginPayload, UpdateUserPayload } from "../types/domain";
import {
  getUserInfoById,
  LoginApi,
  LogoutApi,
  UploadAvatar,
  UpdateUser,
} from "../services/auth.service";

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
    const res = LoginApi(payload);

    if (!res.success || !res.user) {
      throw new Error(res.message);
    }

    setUserInfo(res.user);
  };

  const logout = async () => {
    LogoutApi();
    setUserInfo(null);
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
