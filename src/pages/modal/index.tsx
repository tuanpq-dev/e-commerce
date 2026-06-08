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

type ModalCategoryChildProps = {
  isUpdate?: boolean;
  initialValue?: CategoryType | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: CategoryType) => void;
  options?: CategoryType[];
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
  const selectedCategoryId = Form.useWatch("category", form);

  const selectedCategory = options.find(
    (option) => option.id === selectedCategoryId,
  );

  const optionsChild = selectedCategory?.child ?? [];

  return (
    <Modal
      title={isUpdate ? "Chỉnh sửa sản phẩm" : "Thêm mới sản phẩm"}
      open={open}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (!visible) return;
        if (initialValue) {
          form.setFieldsValue({ ...initialValue });
        } else {
          form.resetFields();
        }
      }}
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
          fieldNames={{ value: "id", label: "name" }}
          options={options}
          placeholder="Chọn danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        />

        {selectedCategoryId && (
          <FormSelect
            label="Danh mục con"
            name="category_child"
            allowClear={true}
            fieldNames={{ value: "id", label: "name" }}
            mode="multiple"
            options={optionsChild}
            placeholder="Chọn danh mục"
          />
        )}

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
      title={isUpdate ? "Chỉnh sửa danh mục cha" : "Thêm mới danh mục cha"}
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
      </Form>
    </Modal>
  );
};

export const ModalCategoryChild = ({
  initialValue,
  isUpdate,
  open,
  onOk,
  onCancel,
  options,
}: ModalCategoryChildProps) => {
  const [form] = Form.useForm();
  const parentOptions = (options ?? []).map((option) => ({
    ...option,
    value: option.id,
    label: option.name,
  }));

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
      title={isUpdate ? "Chỉnh sửa danh mục con" : "Thêm mới danh mục con"}
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

        <FormSelect
          label="Danh mục"
          name="id"
          options={parentOptions}
          placeholder="Chọn danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục cha" }]}
        />
      </Form>
    </Modal>
  );
};
