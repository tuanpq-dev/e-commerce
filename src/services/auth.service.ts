import openNotification from "../@crema/core/Notification";
import { mockAccount, mockUser } from "../mocks/user.mock";
import type { LoginPayload, RegisterPayload, UpdateUserPayload } from "../types/domain";

const getAccounts = () => {
  const local = localStorage.getItem("custom_accounts");
  const parsed = local ? JSON.parse(local) : [];
  return [...mockAccount, ...parsed];
};

const getUsers = () => {
  const local = localStorage.getItem("custom_users");
  const parsed = local ? JSON.parse(local) : [];
  return [...mockUser, ...parsed];
};

export const LoginApi = (payload: LoginPayload) => {
  const account = getAccounts().find((item) => {
    return item.email === payload.email && item.password === payload.password;
  });

  const user = getUsers().find((item) => {
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

export const getUserInfoById = () => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const storedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  if (!token || !storedUser) return;

  return JSON.parse(storedUser);
};

export const RegisterApi = (payload: RegisterPayload) => {
  const accounts = getAccounts();
  const emailExists = accounts.some(
    (item) => item.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (emailExists) {
    openNotification("error", {
      message: "Thất bại",
      description: "Email đã tồn tại trên hệ thống!",
    });

    return {
      success: false,
      message: "Email đã tồn tại trên hệ thống!",
    };
  }

  const newId = Date.now();
  const newAccount = {
    id: newId,
    email: payload.email,
    password: payload.password,
  };

  const newUser = {
    id: newId,
    name: payload.name,
    username: payload.email.split("@")[0],
    email: payload.email,
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
    role: "staff",
  };

  // Save custom account
  const localAccounts = localStorage.getItem("custom_accounts");
  const parsedAccounts = localAccounts ? JSON.parse(localAccounts) : [];
  parsedAccounts.push(newAccount);
  localStorage.setItem("custom_accounts", JSON.stringify(parsedAccounts));

  // Save custom user
  const localUsers = localStorage.getItem("custom_users");
  const parsedUsers = localUsers ? JSON.parse(localUsers) : [];
  parsedUsers.push(newUser);
  localStorage.setItem("custom_users", JSON.stringify(parsedUsers));

  openNotification("success", {
    message: "Thành công",
    description: "Đăng ký tài khoản thành công",
  });

  return {
    success: true,
    user: newUser,
  };
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

  const user = getUsers().find((item) => String(item.id) === String(userId));

  if (!user) {
    return {
      success: false,
      message: "Không tìm thấy người dùng",
    };
  }

  const updatedUser = { ...user, ...payload };

  // Update in custom_users if it exists there
  const localUsers = localStorage.getItem("custom_users");
  if (localUsers) {
    const parsedUsers = JSON.parse(localUsers);
    const index = parsedUsers.findIndex(
      (item: { id: string | number }) => String(item.id) === String(user.id)
    );
    if (index !== -1) {
      parsedUsers[index] = updatedUser;
      localStorage.setItem("custom_users", JSON.stringify(parsedUsers));
    }
  }

  localStorage.setItem("user", JSON.stringify(updatedUser));
  sessionStorage.setItem("user", JSON.stringify(updatedUser));

  return {
    success: true,
    user: updatedUser,
  };
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const UploadAvatar = async (file: File) => {
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

  const avatar = await fileToBase64(file);

  return UpdateUser({ avatar });
};
