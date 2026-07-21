import { Form, message, Upload, Avatar, type FormInstance } from "antd";
import { useEffect, useState } from "react";
import FormInput from "../../@crema/core/Form/FormInput";
import { useTranslation } from "react-i18next";
import AntButton from "../../@crema/component/AntButton";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";

export type ModalProfileFormValues = {
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
};

type ModalProfileProps = {
  form: FormInstance<ModalProfileFormValues>;
  initialValues: any;
  isUpdate?: boolean;
  onFileChange?: (file: File | null) => void;
};

const ModalProfile = ({ form, initialValues, isUpdate = true, onFileChange }: ModalProfileProps) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.fullname || initialValues.name || "",
        email: initialValues.email || "",
        phone: initialValues.phone || "",
        image: initialValues.avatar || initialValues.image || "",
      });
      setPreviewUrl(initialValues.avatar || initialValues.image || "");
    }
  }, [form, initialValues]);

  const handleBeforeUpload = (file: File) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(`${file.name} kích thước phải nhỏ hơn 2MB!`);
      return false;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    onFileChange?.(file);

    return false;
  };

  return (
    <Form form={form} layout="vertical">
      <FormInput
        label="Họ và tên"
        name="name"
        rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
      />

      <FormInput
        label="Email"
        name="email"
        disabled={isUpdate}
      />

      <FormInput
        label="Số điện thoại"
        name="phone"
        rules={[
          {
            pattern: /^[0-9]{10,11}$/,
            message: "Số điện thoại không hợp lệ (10-11 chữ số)",
          },
        ]}
      />

      <Form.Item label={t("product.columns.image") || "Hình ảnh"}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar
            size={64}
            src={previewUrl || undefined}
            icon={!previewUrl ? <UserOutlined /> : undefined}
            style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
          />
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleBeforeUpload}
          >
            <AntButton icon={<UploadOutlined />}>Chọn ảnh</AntButton>
          </Upload>
        </div>
      </Form.Item>
    </Form>
  );
};

export default ModalProfile;
