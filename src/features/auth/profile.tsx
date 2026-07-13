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
import { useTranslation } from "react-i18next";

const Profile = () => {
  const { t } = useTranslation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm();
  const { getUserInfo, userInfo, updateUser, uploadAvatar, refreshUser } =
    useAuth();

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  if (!userInfo) return null;
  const profile = userInfo.profile;

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
        user: `${profile?.lastName} ${profile?.firstName}`,
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
        title={t("common.name")}
        extra={
          <button onClick={handleUpdateProfile}>{t("common.update")}</button>
        }
      >
        <div className="profile-layout">
          <div style={{ flex: 1 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t("common.name")}>
                {`${profile?.lastName} ${profile?.firstName}`}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {userInfo.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {profile.phoneNumber}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Card className="profile-card">
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
                <Button type="primary">{t("common.updateAvatar")}</Button>
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
