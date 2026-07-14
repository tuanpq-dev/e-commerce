import { Button, Drawer, Grid, Layout, Menu, type MenuProps } from "antd";
import React, { useState } from "react";
import AppHeader from "./Default/AppHeader";
import AppBreadcrumb from "./Default/AppBreadcrumb";
import { useLocation, useNavigate } from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { menuConfig } from "../../../pages/sample/menu.config";
import { useThemeMode } from "../../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

type AppLayoutProps = React.PropsWithChildren;

const siderStyle: React.CSSProperties = {
  textAlign: "center",
  lineHeight: "120px",  
  color: "#fff",
  backgroundColor: "var(--app-surface-muted)",
};

const menuStyle: React.CSSProperties = {
  minWidth: 0,
  textAlign: "left",
  backgroundColor: "var(--app-surface-muted)",
  border: "none",
};

const siderContentStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  fontWeight: 500,
  border: "1px solid var(--app-border)",
};

const contentStyle: React.CSSProperties = {
  background: "var(--app-content-bg)",
  minHeight: "calc(100vh - 64px)",
  overflowY: "auto",
  overflowX: "hidden",
  border: "1px solid var(--app-border)",
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = location.pathname.split("/")[1];
  const { Sider } = Layout;
  const { mode } = useThemeMode();
  const { t } = useTranslation();

  const MenuHorizontal: MenuProps["items"] = menuConfig.map((item) => ({
    key: item.path,
    label: t(`sider.${item.label}`),
    icon: item.icon,
  }));

  const handleRedirect = (key: string) => {
    navigate(`/${key}`);
    setDrawerOpen(false);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const sidebarContent = (
    <div style={siderContentStyle}>
      <div>
        <div
          style={{
            height: 64,
            background: "var(--app-surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => navigate("/dashboard")}
        >
          <img
            src="/favicon.svg"
            alt="E-commerce logo"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
        </div>
        <Menu
          theme={mode}
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MenuHorizontal}
          onClick={({ key }) => handleRedirect(key)}
          style={menuStyle}
          inlineCollapsed={!isMobile && collapsed}
        />
      </div>

      {!isMobile && (
        <Button
          onClick={toggleCollapsed}
          style={{
            marginBottom: 16,
            background: "var(--app-surface-muted)",
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
      )}
    </div>
  );

  return (
    <Layout className="app-shell" style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider
          width={240}
          style={siderStyle}
          collapsedWidth={80}
          collapsed={collapsed}
        >
          {sidebarContent}
        </Sider>
      )}

      <Drawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        styles={{
          body: { padding: 0, background: "var(--app-surface-muted)" },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        <AppHeader
          menuButton={
            isMobile ? (
              <Button
                icon={<MenuUnfoldOutlined />}
                onClick={() => setDrawerOpen(true)}
              />
            ) : undefined
          }
        />
        <Layout.Content className="app-content" style={contentStyle}>
          <AppBreadcrumb />
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default React.memo(AppLayout);
