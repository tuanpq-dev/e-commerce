import { Avatar, Button, Dropdown, Layout } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { DownOutlined } from "@ant-design/icons";
import config from "../../../../config";
import { useAuth } from "../../../../contexts/AuthContext";
import ThemeToggle from "../../../component/ThemeToggle";
import LanguageToggle from "../../../component/LanguageToggle";

type AppHeaderProps = {
  menuButton?: ReactNode;
};

const AppHeader = ({ menuButton }: AppHeaderProps) => {
  const token = localStorage.getItem('accessToken');
  const { Header } = Layout;
  const navigate = useNavigate();
  const { logout, userInfo } = useAuth();

  const headerStyle = {
    alignItems: "center",
    backgroundColor: "var(--app-header-bg)",
    display: "flex",
    gap: 24,
    height: 64,
    justifyContent: menuButton ? "space-between" : "flex-end",
    paddingInline: 48,
    border: "1px solid var(--app-border)",
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
      logout()
      navigate("/");
    } else {
      navigate(`/${key}`);
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
    <Header className="app-header" style={headerStyle}>
      {menuButton}
      <div className="app-header-actions">
        <LanguageToggle />
        <ThemeToggle />
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleUserMenuClick,
          }}
        >
          <Button type="text">
            <Avatar size={30} src={userInfo?.image} />
            <DownOutlined />
          </Button>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AppHeader;
