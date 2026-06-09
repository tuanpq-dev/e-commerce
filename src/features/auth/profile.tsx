import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Modal,
  Space,
  Typography,
  Upload,
  type UploadProps,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import ModalProfile from "./modal-profile";
import openNotification from "../../@crema/core/Notification";
import { CreateActiveLog } from "../../api/activeLogApi";

const Profile = () => {
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm();
  const { getUserInfo, userInfo, updateUser, uploadAvatar, refreshUser } =
    useAuth();

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  if (!userInfo) return null;

  const handleUpdateProfile = () => {
    setIsUpdate(true);
  };

  const handleSubmitUpdate = async () => {
    const values = await form.validateFields();

    await Promise.all([
      updateUser(values),
      CreateActiveLog({
        module: "Profile",
        action: "UPDATE",
        user: userInfo?.name,
      }),
    ]);
    setIsUpdate(false);
    refreshUser();
    openNotification("success", {
      message: "Thành công",
      description: "Chỉnh sửa thông tin thành công",
    });
  };

  const handleUploadAvatar: UploadProps["beforeUpload"] = async (file) => {
    if (!file.type.startsWith("image/")) {
      openNotification("error", {
        message: "Thất bại",
        description: "Vui lòng chọn file ảnh",
      });

      return Upload.LIST_IGNORE;
    }

    await Promise.all([
      uploadAvatar(file),
      CreateActiveLog({
        module: "Profile - Avatar",
        action: "UPLOAD",
        user: userInfo?.name,
      }),
    ]);
    openNotification("success", {
      message: "Thành công",
      description: "Cập nhật ảnh đại diện thành công",
    });

    return false;
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
            <Space vertical size={16}>
              <Avatar size={96} icon={<UserOutlined />} src={userInfo.avatar} />

              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {userInfo.name}
                </Typography.Title>

                <Typography.Text type="secondary">
                  {userInfo.email}
                </Typography.Text>
              </div>

              <Upload
                accept="image/*"
                beforeUpload={handleUploadAvatar}
                maxCount={1}
                showUploadList={false}
              >
                <Button type="primary">Cập nhật</Button>
              </Upload>
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
