import { Button, Dropdown, Layout } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../../api/mockApi";
import { useEffect } from "react";
import { DownOutlined } from "@ant-design/icons";
import config from "../../../../config";
import { getUserInfoById, LogoutApi } from "../../../../services/auth.service";
import { useAuth } from "../../../../contexts/AuthContext";

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
      key: config.routes.PROFILE,
      label: "Profile",
    },
    {
      key: "logout",
      label: "Logout",
    },
  ];

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      LogoutApi();
      navigate("/");
    } else {
      navigate(`/${key}`);
    }
  };

  const getUserName = () => {
    const { userInfo } = useAuth();

    return userInfo ? userInfo.name : "You";
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
