import { useEffect } from "react";
import { Form, Modal } from "antd";
import type { CategoryType } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";

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
          rules={[
            { required: true, message: "Vui lòng nhập tên danh mục" },
            {
              min: 1,
              message: "Tên danh mục tối thiểu 1 ký tự",
            },
            {
              max: 30,
              message: "Tên danh mục tối đa 30 ký tự",
            },
          ]}
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
          label="Tên danh mục con"
          name="name"
          rules={[
            { required: true, message: "Vui lòng nhập tên danh mục con" },
            {
              min: 1,
              message: "Tên danh mục con tối thiểu 1 ký tự",
            },
            {
              max: 30,
              message: "Tên danh mục con tối đa 30 ký tự",
            },
          ]}
        />

        {!isUpdate && (
          <FormSelect
            label="Danh mục"
            name="id"
            options={parentOptions}
            placeholder="Chọn danh mục"
            rules={[
              { required: true, message: "Vui lòng chọn danh mục cha" },
            ]}
          />
        )}
      </Form>
    </Modal>
  );
};
