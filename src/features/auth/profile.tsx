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
  message,
} from "antd";
import { UserOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import ModalProfile from "./modal-profile";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";

const Profile = () => {
  const { t } = useTranslation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [form] = Form.useForm();
  const { userInfo, updateProfile } = useAuth();

  if (!userInfo) return null;

  const handleOpenModal = () => {
    setIsUpdate(true);
  };

  const handleCloseModal = () => {
    setIsUpdate(false);
  };

  const handleSubmitProfile = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let imageUrl = values.image;

      if (pendingAvatarFile) {
        const formData = new FormData();
        formData.append("image", pendingAvatarFile);

        const res: any = await axiosClient.post("/auth/upload-avatar", formData, {
          headers: { "Content-Type": undefined },
        });


        if (res && res.imageUrl) {
          imageUrl = res.imageUrl;
        } else {
          message.error("Tải ảnh lên thất bại, không nhận được URL!");
          return;
        }
      }

      await updateProfile(userInfo.id, {
        name: values.name,
        phone: values.phone,
        image: imageUrl,
      });

      setPendingAvatarFile(null);
      setIsUpdate(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin cá nhân:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res: any = await axiosClient.post("/auth/upload-avatar", formData, {
        headers: { "Content-Type": undefined },
      });

      if (res && res.imageUrl) {
        await updateProfile(userInfo.id, { image: res.imageUrl });
        message.success("Cập nhật ảnh đại diện thành công!");
      } else {
        message.error("Tải ảnh lên thất bại, không nhận được URL trả về!");
      }
    } catch (err: any) {
      console.error("Upload avatar failed:", err);
      message.error(typeof err === "string" ? err : "Cập nhật ảnh đại diện thất bại!");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <>
      <Card
        title="Thông tin cá nhân"
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={handleOpenModal}>
            {t("common.update") || "Cập nhật"}
          </Button>
        }
      >
        <div className="profile-layout" style={{ display: "flex", gap: "24px" }}>
          <div style={{ flex: 1 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Họ và tên">
                {userInfo.fullname || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {userInfo.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {userInfo?.phone || "Chưa cập nhật số điện thoại!"}
              </Descriptions.Item>

              <Descriptions.Item label="Vai trò">
                {userInfo?.role || "USER"}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Card className="profile-card" style={{ width: 280, textAlign: "center" }}>
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              <Avatar
                size={96}
                icon={<UserOutlined />}
                src={userInfo.avatar}
                style={{ margin: "0 auto", backgroundColor: "#1890ff" }}
              />

              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {userInfo.fullname}
                </Typography.Title>

                <Typography.Text type="secondary">
                  {userInfo.email}
                </Typography.Text>
              </div>

              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  const isLt2M = file.size / 1024 / 1024 < 5;
                  if (!isLt2M) {
                    message.error("Kích thước ảnh phải nhỏ hơn 5MB!");
                    return false;
                  }
                  handleAvatarUpload(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadingAvatar}>
                  {t("common.updateAvatar") || "Đổi ảnh đại diện"}
                </Button>
              </Upload>
            </Space>
          </Card>
        </div>
      </Card>

      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={isUpdate}
        onCancel={handleCloseModal}
        onOk={handleSubmitProfile}
        confirmLoading={loading}
        okText={t("common.save") || "Lưu thay đổi"}
        cancelText={t("common.cancel") || "Hủy"}
      >
        <ModalProfile
          form={form}
          initialValues={userInfo}
          isUpdate={isUpdate}
          onFileChange={setPendingAvatarFile}
        />
      </Modal>
    </>
  );
};

export default Profile;
