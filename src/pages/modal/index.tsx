import { useEffect } from "react";
import { Flex, Form, Modal } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import FormInput from "../../@crema/core/Form/FormInput";
import type { CategoryType, ProductInitialValues } from "../../types/domain";
import "./index.css";
import FormSelect from "../../@crema/core/Form/FormSelect";
import AntButton from "../../@crema/component/AntButton";
import AntUpload from "../../@crema/component/AntUpload";

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
    (option) => String(option.id) === String(selectedCategoryId),
  );
  const optionsChild = selectedCategory?.child ?? [];

  const normalizeCategoryChild = (
    categoryChild: ProductInitialValues["category_child"],
  ) =>
    (categoryChild ?? [])
      .map((item) => {
        if (typeof item === "object") {
          return item.id;
        }

        return item;
      })
      .filter((item): item is string | number => item !== undefined);

  const getInitialProductValue = () => {
    if (!initialValue) {
      return {
        variants: [{}],
      };
    }

    if (initialValue.variants?.length) {
      return {
        ...initialValue,
        category_child: normalizeCategoryChild(initialValue.category_child),
      };
    }

    return {
      ...initialValue,
      category_child: normalizeCategoryChild(initialValue.category_child),
      variants: [
        {
          size: "Default",
          color: "Default",
          price: initialValue.price,
          stock: initialValue.stock,
          sku: initialValue.sku,
        },
      ],
    };
  };

  return (
    <Modal
      title={isUpdate ? "Chỉnh sửa sản phẩm" : "Thêm mới sản phẩm"}
      width="min(960px, calc(100vw - 24px))"
      open={open}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (!visible) return;
        form.resetFields();
        form.setFieldsValue(getInitialProductValue());
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
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên sản phẩm",
            },
            {
              min: 3,
              message: "Tên sản phẩm tối thiểu 3 ký tự",
            },
            {
              max: 50,
              message: "Tên sản phẩm tối đa 50 ký tự",
            },
          ]}
        />
        <FormInput
          label="SKU"
          name="sku"
          disabled={isUpdate}
          rules={[
            { required: true, message: "Vui lòng nhập SKU" },
            {
              min: 3,
              message: "SKU tối thiểu 3 ký tự",
            },
            {
              max: 20,
              message: "SKU tối đa 20 ký tự",
            },
          ]}
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
            placeholder="Chọn danh mục con"
          />
        )}

        <Form.List
          name="variants"
          rules={[
            {
              validator: async (_, variants) => {
                if (!variants?.length) {
                  throw new Error("Vui lòng thêm ít nhất một biến thể");
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <Flex vertical gap="small">
              <div className="product-variant-header">
                <strong>Biến thể sản phẩm</strong>
                <AntButton
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add()}
                >
                  Thêm biến thể
                </AntButton>
              </div>

              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="product-variant-row">
                  <FormInput
                    {...restField}
                    label="Size"
                    name={[name, "size"]}
                    rules={[
                      { required: true, message: "Nhập size" },
                      { required: true, message: "Vui lòng nhập SKU" },
                      {
                        min: 1,
                        message: "Size tối thiểu 1 ký tự",
                      },
                      {
                        max: 5,
                        message: "Size tối đa 5 ký tự",
                      },
                    ]}
                    placeholder="S, M, L..."
                  />
                  <FormInput
                    {...restField}
                    label="Màu"
                    name={[name, "color"]}
                    rules={[
                      { required: true, message: "Nhập màu" },
                      { required: true, message: "Vui lòng nhập SKU" },
                      {
                        max: 15,
                        message: "Màu tối đa 15 ký tự",
                      },
                    ]}
                    placeholder="Đen, trắng..."
                  />
                  <FormInput
                    {...restField}
                    label="Giá"
                    name={[name, "price"]}
                    rules={[
                      { required: true, message: "Nhập giá" },
                      { required: true, message: "Vui lòng nhập SKU" },
                      {
                        max: 10,
                        message: "Giá tối đa 10 ký tự",
                      },
                    ]}
                    type="number"
                    min={0}
                  />
                  <FormInput
                    {...restField}
                    label="Tồn kho"
                    name={[name, "stock"]}
                    rules={[
                      { required: true, message: "Nhập tồn kho" },
                      { required: true, message: "Vui lòng nhập SKU" },
                      {
                        max: 5,
                        message: "Tồn kho tối đa 5 ký tự",
                      },
                    ]}
                    type="number"
                    min={0}
                  />
                  <FormInput
                    {...restField}
                    label="SKU"
                    name={[name, "sku"]}
                    placeholder="Tự sinh nếu trống"
                  />
                  <AntUpload />
                  <AntButton
                    danger
                    icon={<DeleteOutlined />}
                    disabled={fields.length === 1}
                    onClick={() => remove(name)}
                    style={{ marginTop: 30 }}
                  />
                </div>
              ))}

              <Form.ErrorList errors={errors} />
            </Flex>
          )}
        </Form.List>

        <FormInput label="Mô tả" name="description" textarea />
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
            rules={[{ required: true, message: "Vui lòng chọn danh mục cha" }]}
          />
        )}
      </Form>
    </Modal>
  );
};
