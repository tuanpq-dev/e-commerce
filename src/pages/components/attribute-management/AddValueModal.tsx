import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Tooltip, Typography } from "antd";
import FormInput from "../../../@crema/core/Form/FormInput";

const { Text } = Typography;

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
      const success = await onOk?.(value, modifier ?? 0);
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
        <Form.Item
          label={
            <Tooltip title="Cộng (+) hoặc trừ (-) thêm vào giá sàn của sản phẩm khi khách chọn giá trị này">
              Chênh lệch giá (±VNĐ){" "}
              <Text type="secondary" style={{ fontSize: 12 }}>
                tuỳ chọn
              </Text>
            </Tooltip>
          }
          name="modifier"
          initialValue={0}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="0"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => Number(v?.replace(/,/g, "") ?? 0)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
