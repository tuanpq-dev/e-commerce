import { useEffect } from "react";
import { Button, Form, Input, Modal, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import FormInput from "../../@crema/core/Form/FormInput";

type ProductInitialValues = {
  prod_name?: string;
  sku?: string;
  category?: string;
  price?: number | string;
  stock?: number | string;
  description?: string;
  images?: string[];
};

type ModalProductProps = {
  initialValue?: ProductInitialValues | null;
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
};

export const ModalProduct = ({
  initialValue,
  open,
  onCancel,
  onOk,
}: ModalProductProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialValue) {
      form.setFieldsValue(initialValue);
      return;
    }

    form.resetFields();
  }, [form, initialValue, open]);

  return (
    <Modal
      title="Thêm mới sản phẩm"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      destroyOnHidden
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <FormInput label="Tên sản phẩm" name="prod_name" />
        <FormInput label="SKU" name="sku" />
        <FormInput label="Danh mục" name="category" />
        <FormInput label="Giá" name="price" />
        <FormInput label="Tồn kho" name="stock" />
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea placeholder="Nhập mô tả" />
        </Form.Item>
        <Form.Item label="Ảnh" name="images" valuePropName="fileList">
          <Upload beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
