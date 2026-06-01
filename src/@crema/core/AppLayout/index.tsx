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
  backgroundColor: "#fff",
};

const MenuHorizontal: MenuProps["items"] = samplePageConfig.map((item) => ({
  key: item.path,
  label: `${item.label}`,
}));

const menuStyle = {
  flex: 1,
  minWidth: 0,
};

const siderContentStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const contentStyle: React.CSSProperties = {
  background: "#f5f7fb",
  minHeight: "calc(100vh - 64px)",
  overflow: "auto",
  padding: 24,
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
          width={200}
          style={siderStyle}
          collapsedWidth={80}
          collapsed={collapsed}
        >
          <div style={siderContentStyle}>
            <div>
              <div
                style={{
                  height: 64,
                  background: "gray",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                EC
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

            <Button onClick={toggleCollapsed} style={{ marginBottom: 16 }}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
          </div>
        </Sider>
        <Layout>
          <AppHeader />
          <Layout.Content style={contentStyle}>{children}</Layout.Content>
        </Layout>
      </Layout>
    </Flex>
  );
};

export default React.memo(AppLayout);
