import { useEffect } from "react";
import { Button, Form, Input, Modal, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import FormInput from "../../@crema/core/Form/FormInput";
import type { CategoryType, ProductInitialValues } from "../../types/domain";
import "./index.css";
import FormSelect from "../../@crema/core/Form/FormSelect";

type ModalProductProps = {
  isUpdate?: boolean;
  initialValue?: ProductInitialValues | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: ProductInitialValues) => void;
  options: CategoryType[];
};

type ModalCategoryProps = {
  isUpdate?: boolean;
  initialValue?: CategoryType | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: CategoryType) => void;
};

export const ModalProduct = ({
  isUpdate,
  initialValue,
  open,
  onCancel,
  onOk,
  options,
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
      title={isUpdate ? "Chỉnh sửa sản phẩm" : "Thêm mới sản phẩm"}
      open={open}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      destroyOnHidden
      okText={isUpdate ? "Lưu" : "Thêm mới"}
      cancelText="Hủy"
      className="product-modal"
    >
      <Form form={form} layout="vertical">
        <FormInput
          label="Tên sản phẩm"
          name="name"
          required={true}
          rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
        />
        <FormInput
          label="SKU"
          name="sku"
          disabled={isUpdate}
          rules={[{ required: true, message: "Vui lòng nhập SKU" }]}
        />

        <FormSelect
          label="Danh mục"
          name="category"
          options={options}
          placeholder="Chọn danh mục"
          rules={[{ required: true, message: "Vui lòng Chọn danh mục" }]}
        />

        <FormInput
          label="Giá"
          name="price"
          rules={[{ required: true, message: "Vui lòng nhập giá" }]}
        />
        <FormInput
          label="Tồn kho"
          name="stock"
          disabled={isUpdate}
          rules={[{ required: true, message: "Vui lòng nhập tồn kho" }]}
        />
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea placeholder="Nhập mô tả" />
        </Form.Item>
        <Form.Item label="Ảnh" name="image" valuePropName="fileList">
          <Upload beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const ModalCategory = ({
  initialValue,
  isUpdate,
  open,
  onOk,
  onCancel,
}: ModalCategoryProps) => {
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
      title={isUpdate ? "Chỉnh sửa danh mục" : "Thêm mới danh mục"}
      open={open}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      okText={isUpdate ? "Lưu" : "Thêm mới"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <FormInput
          label="Tên danh mục"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
        />
        <FormInput
          label="Tổng"
          name="total"
          disabled={isUpdate}
          rules={[{ required: true, message: "Vui lòng nhập tổng" }]}
        />
      </Form>
    </Modal>
  );
};
