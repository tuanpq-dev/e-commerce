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
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import ModalProfile from "./modal-profile";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const { t } = useTranslation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm();
  const { userInfo } = useAuth();

  if (!userInfo) return null;

  return (
    <>
      <Card
        title={t("common.name")}
        extra={
          <button>{t("common.update")}</button>
        }
      >
        <div className="profile-layout">
          <div style={{ flex: 1 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t("common.name")}>
                {userInfo.fullname}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {userInfo.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {userInfo?.phone || 'Chưa cập nhật số điện thoại!'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Card className="profile-card">
            <Space vertical size={16}>
              <Avatar size={96} icon={<UserOutlined />} src={userInfo.avatar} />

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
