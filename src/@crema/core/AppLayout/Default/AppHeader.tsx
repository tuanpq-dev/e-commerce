import { Button, Dropdown, Layout } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../../api/mockApi";
import { useEffect } from "react";
import { DownOutlined } from "@ant-design/icons";
import openNotification from "../../Notification";
import config from "../../../../config";

const AppHeader = () => {
  const token = getAccessToken();
  const { Header } = Layout;
  const navigate = useNavigate();

  const headerStyle = {
    alignItems: "center",
    backgroundColor: "#fff",
    display: "flex",
    gap: 24,
    height: 64,
    justifyContent: "flex-end",
    paddingInline: 48,
    border: "1px solid #f3f5f7",
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: config.routes.CUSTOMER_MANAGEMENT,
      label: "Profile",
    },
    {
      key: "logout",
      label: "Logout",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    navigate("/login");

    openNotification("success", {
      message: "Thành công",
      description: "Đăng xuất thành công",
    });
  };

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else {
      navigate(`/${key}`);
    }
  };

  const getUserName = () => {
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!user) {
      return "Admin";
    }

    try {
      return JSON.parse(user).name || "You";
    } catch {
      return "You";
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  if (!token) {
    return null;
  }

  return (
    <Header style={headerStyle}>
      <Dropdown
        menu={{
          items: userMenuItems,
          onClick: handleUserMenuClick,
        }}
      >
        <Button type="text">
          {getUserName()} <DownOutlined />
        </Button>
      </Dropdown>
    </Header>
  );
};

export default AppHeader;
