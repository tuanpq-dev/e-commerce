import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Modal,
  Space,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import ModalProfile from "./modal-profile";
import openNotification from "../../@crema/core/Notification";

const Profile = () => {
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm();
  const { getUserInfo, userInfo, updateUser, refreshUser } = useAuth();

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  if (!userInfo) return null;

  const handleUpdateProfile = () => {
    setIsUpdate(true);
  };

  const handleSubmitUpdate = async () => {
    const values = await form.validateFields();

    await updateUser(values);
    setIsUpdate(false);
    refreshUser();
    openNotification("success", {
      message: "Thành công",
      description: "Chỉnh sửa thông tin thành công",
    });
  };

  return (
    <>
      <Card
        title="Thông tin cá nhân"
        extra={<button onClick={handleUpdateProfile}>Chỉnh sửa</button>}
      >
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
              <Descriptions.Item label="Tên">{userInfo.name}</Descriptions.Item>

              <Descriptions.Item label="Email">
                {userInfo.email}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Card style={{ width: 240, textAlign: "center" }}>
            <Space direction="vertical" size={16}>
              <Avatar size={96} icon={<UserOutlined />} />

              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {userInfo.name}
                </Typography.Title>

                <Typography.Text type="secondary">
                  {userInfo.email}
                </Typography.Text>
              </div>

              <Button type="primary">Cập nhật</Button>
            </Space>
          </Card>
        </div>
      </Card>

      <Modal
        title="Chỉnh sửa thông tin"
        open={isUpdate}
        onCancel={() => setIsUpdate(false)}
        onOk={handleSubmitUpdate}
      >
        <ModalProfile
          form={form}
          initialValues={userInfo}
          isUpdate={isUpdate}
        />
      </Modal>
    </>
  );
};

export default Profile;
