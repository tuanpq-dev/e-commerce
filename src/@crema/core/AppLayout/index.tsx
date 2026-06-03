import { Button, Flex, Layout, Menu, type MenuProps } from "antd";
import React, { useState } from "react";
import AppHeader from "./Default/AppHeader";
import { samplePageConfig } from "../../../pages/sample";
import { useLocation, useNavigate } from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

type AppLayoutProps = React.PropsWithChildren;

const siderStyle: React.CSSProperties = {
  textAlign: "center",
  lineHeight: "120px",
  color: "#fff",
  backgroundColor: "#f3f5f7",
};

const MenuHorizontal: MenuProps["items"] = samplePageConfig.map((item) => ({
  key: item.path,
  label: `${item.label}`,
  icon: item.icon,
}));

const menuStyle: React.CSSProperties = {
  minWidth: 0,
  textAlign: "left",
  backgroundColor: "#f3f5f7",
  border: "none",
};

const siderContentStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  fontWeight: 500,
  border: "1px solid #f3f5f7",
};

const contentStyle: React.CSSProperties = {
  background: "#fff",
  minHeight: "calc(100vh - 64px)",
  overflowY: "auto",
  overflowX: "hidden",
  padding: 24,
  border: "1px solid #f3f5f7",
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { Sider } = Layout;

  const handleRedirect = (key: string) => {
    navigate(`/${key}`);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Flex gap="medium">
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          width={240}
          style={siderStyle}
          collapsedWidth={80}
          collapsed={collapsed}
        >
          <div style={siderContentStyle}>
            <div>
              <div
                style={{
                  height: 64,
                  background: "#f3f5f7",
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
                theme="light"
                mode="inline"
                selectedKeys={[location.pathname.replace("/", "")]}
                items={MenuHorizontal}
                onClick={({ key }) => handleRedirect(key)}
                style={menuStyle}
                inlineCollapsed={collapsed}
              />
            </div>

            <Button
              onClick={toggleCollapsed}
              style={{ marginBottom: 16, background: "#f3f5f7" }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
          </div>
        </Sider>
        <Layout style={{ height: "100vh", overflow: "hidden" }}>
          <AppHeader />
          <Layout.Content style={contentStyle}>{children}</Layout.Content>
        </Layout>
      </Layout>
    </Flex>
  );
};

export default React.memo(AppLayout);
