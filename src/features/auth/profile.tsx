import { Avatar, Button, Card, Descriptions, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const Profile = () => {
  const user = {
    name: "Admin",
    email: "admin@gmail.com",
    username: "admin",
  };

  return (
    <Card title="Thông tin cá nhân">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên">{user.name}</Descriptions.Item>

            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>

            <Descriptions.Item label="Username">
              {user.username}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Card style={{ width: 240, textAlign: "center" }}>
          <Space direction="vertical" size={16}>
            <Avatar size={96} icon={<UserOutlined />} />

            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {user.name}
              </Typography.Title>

              <Typography.Text type="secondary">{user.email}</Typography.Text>
            </div>

            <Button type="primary">Cập nhật</Button>
          </Space>
        </Card>
      </div>
    </Card>
  );
};

export default Profile;
