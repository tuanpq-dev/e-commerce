import openNotification from "../@crema/core/Notification";
import { mockAccount, mockUser } from "../mocks/user.mock";
import type { LoginPayload, UpdateUserPayload } from "../types/domain";

export const LoginApi = (payload: LoginPayload) => {
  const account = mockAccount.find((item) => {
    return item.email === payload.email && item.password === payload.password;
  });

  const user = mockUser.find((item) => {
    return item.id === account?.id;
  });

  if (!account || !user) {
    openNotification("error", {
      message: "Thất bại",
      description: "Email hoặc Password không đúng",
    });

    return {
      success: false,
      message: "Email hoặc Password không đúng",
    };
  }

  const token = `access_token_${account.id}_${Date.now()}`;

  localStorage.setItem("accessToken", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userId", String(user.id));

  sessionStorage.setItem("accessToken", token);
  sessionStorage.setItem("user", JSON.stringify(user));
  sessionStorage.setItem("userId", String(user.id));

  openNotification("success", {
    message: "Thành công",
    description: "Đăng nhập thành công",
  });

  return {
    success: true,
    accessToken: token,
    user,
  };
};

export const LogoutApi = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");

  openNotification("success", {
    message: "Thành công",
    description: "Đăng xuất thành công",
  });

  return {
    message: "Logout success",
  };
};

export const getUserInfoById = () => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const storedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  if (!token || !storedUser) return;

  return JSON.parse(storedUser);
};

export const UpdateUser = (payload: UpdateUserPayload) => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");
  const userId =
    localStorage.getItem("userId") || sessionStorage.getItem("userId");

  if (!token || !userId) {
    return {
      success: false,
      message: "Chưa đăng nhập",
    };
  }

  const user = mockUser.find((item) => item.id === Number(userId));

  if (!user) {
    return {
      success: false,
      message: "Không tìm thấy người dùng",
    };
  }

  const updatedUser = { ...user, ...payload };

  localStorage.setItem("user", JSON.stringify(updatedUser));
  sessionStorage.setItem("user", JSON.stringify(updatedUser));

  return {
    success: true,
    user: updatedUser,
  };
};
