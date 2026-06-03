export const mockApiLogin = async (email: string, password: string) => {
  if (email === "admin" && password === "123456") {
    return {
      accessToken: `access_token ${Date.now()}`,
      user: {
        id: 1,
        username: "admin",
        name: "Admin",
      },
    };
  }

  throw new Error("Email hoặc mật khẩu không đúng");
};

export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const apiUrl = "http://localhost:3001";
