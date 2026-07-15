import React, { useEffect } from "react";
import { Modal, Form } from "antd";
import FormInput from "../../../@crema/core/Form/FormInput";

interface AddTitleModalProps {
  open: boolean;
  confirmLoading: boolean;
  onCancel: () => void;
  onOk: (name: string) => Promise<boolean>;
  initialValue?: string;
  title?: string;
  okText?: string;
}

export const AddTitleModal: React.FC<AddTitleModalProps> = ({
  open,
  confirmLoading,
  onCancel,
  onOk,
  initialValue,
  title,
  okText,
}) => {
  const [form] = Form.useForm<{ name: string }>();

  useEffect(() => {
    if (open) {
      if (initialValue) {
        form.setFieldsValue({ name: initialValue });
      } else {
        form.resetFields();
      }
    } else {
      form.resetFields();
    }
  }, [open, initialValue, form]);

  const handleOk = async () => {
    try {
      const { name } = await form.validateFields();
      const success = await onOk(name);
      if (success) {
        form.resetFields();
      }
    } catch (error) {
      // Form validation errors are handled automatically by antd
    }
  };

  return (
    <Modal
      title={title ?? "Thêm nhóm thuộc tính mới"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={okText ?? "Thêm"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <FormInput
          label="Tên nhóm thuộc tính"
          name="name"
          placeholder="Ví dụ: Chất liệu, Họa tiết, Độ dày..."
          rules={[
            { required: true, message: "Vui lòng nhập tên nhóm" },
            { min: 2, message: "Tên nhóm tối thiểu 2 ký tự" },
            { max: 40, message: "Tên nhóm tối đa 40 ký tự" },
          ]}
        />
      </Form>
    </Modal>
  );
};
