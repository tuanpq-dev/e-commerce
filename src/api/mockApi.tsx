import openNotification from "../@crema/core/Notification";

export const mockApiLogin = async (email: string, password: string) => {
  if (email === "admin@gmail.com" && password === "123456") {
    openNotification("success", {
      message: "Thành công",
      description: "Đăng nhập thành công",
    });
    return {
      accessToken: `access_token ${Date.now()}`,
      user: {
        id: 1,
        username: "admin",
        name: "Admin",
      },
    };
  } else {
    openNotification("error", {
      message: "Thất bại",
      description: "Email hoặc Password không đúng",
    });
  }

  throw new Error("Email hoặc mật khẩu không đúng");
};

export const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
  );
};

export const apiUrl = "http://localhost:3001";
