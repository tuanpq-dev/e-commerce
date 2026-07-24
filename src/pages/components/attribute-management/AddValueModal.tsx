import React, { useEffect } from "react";
import { Modal, Form } from "antd";
import FormInput from "../../../@crema/core/Form/FormInput";

interface AddValueModalProps {
  open: boolean;
  titleName: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onOk?: (value: string, modifier: number) => Promise<boolean>;
}

export const AddValueModal: React.FC<AddValueModalProps> = ({
  open,
  titleName,
  confirmLoading,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm<{ value: string; modifier: number }>();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const { value, modifier } = await form.validateFields();
      const numModifier = modifier !== undefined && modifier !== null ? Number(modifier) : 0;
      const success = await onOk?.(value, isNaN(numModifier) ? 0 : numModifier);
      if (success) {
        form.resetFields();
      }
    } catch (error) {
      // Form validation errors are handled automatically by antd
    }
  };

  return (
    <Modal
      title={`Thêm giá trị vào nhóm "${titleName}"`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="Thêm"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <FormInput
          label="Giá trị"
          name="value"
          placeholder="Ví dụ: XL, Xanh lam, Lụa, Sọc ngang..."
          rules={[
            { required: true, message: "Vui lòng nhập giá trị" },
            { max: 50, message: "Giá trị tối đa 50 ký tự" },
          ]}
        />
      </Form>
    </Modal>
  );
};
