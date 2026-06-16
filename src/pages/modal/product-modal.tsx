import { Flex, Form, Modal } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { CategoryType, ProductInitialValues } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";
import AntButton from "../../@crema/component/AntButton";
import AntUpload from "../../@crema/component/AntUpload";
import { useTranslation } from "react-i18next";

type ModalProductProps = {
  isUpdate?: boolean;
  initialValue?: ProductInitialValues | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: ProductInitialValues) => void;
  options: CategoryType[];
};

export const ModalProduct = ({
  isUpdate,
  initialValue,
  open,
  onCancel,
  onOk,
  options,
}: ModalProductProps) => {
  const { t } = useTranslation();
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
      title={isUpdate ? t("product.titleUpdate") : t("product.titleCreate")}
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
      okText={isUpdate ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
      className="product-modal"
    >
      <Form form={form} layout="vertical">
        <FormInput
          label={t("product.name")}
          name="name"
          required={true}
          rules={[
            {
              required: true,
              message: t("product.validation.nameRequired"),
            },
            {
              min: 3,
              message: t("product.validation.nameMin"),
            },
            {
              max: 50,
              message: t("product.validation.nameMax"),
            },
          ]}
        />
        <FormInput
          label={t("product.sku")}
          name="sku"
          disabled={isUpdate}
          rules={[
            { required: true, message: t("product.validation.skuRequired") },
            {
              min: 3,
              message: t("product.validation.skuMin"),
            },
            {
              max: 20,
              message: t("product.validation.skuMax"),
            },
          ]}
        />

        <FormSelect
          label={t("product.category")}
          name="category"
          fieldNames={{ value: "id", label: "name" }}
          options={options}
          placeholder={t("product.selectCategory")}
          rules={[{ required: true, message: t("product.validation.categoryRequired") }]}
        />

        {selectedCategoryId && (
          <FormSelect
            label={t("product.categoryChild")}
            name="category_child"
            allowClear={true}
            fieldNames={{ value: "id", label: "name" }}
            mode="multiple"
            options={optionsChild}
            placeholder={t("product.selectCategoryChild")}
          />
        )}

        <Form.List
          name="variants"
          rules={[
            {
              validator: async (_, variants) => {
                if (!variants?.length) {
                  throw new Error(t("product.validation.variantsRequired"));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <Flex vertical gap="small">
              <div className="product-variant-header">
                <strong>{t("product.variant")}</strong>
                <AntButton
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add()}
                >
                  {t("product.addVariant")}
                </AntButton>
              </div>

              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="product-variant-row">
                  <FormInput
                    {...restField}
                    label={t("product.size")}
                    name={[name, "size"]}
                    rules={[
                      { required: true, message: t("product.validation.sizeRequired") },
                      {
                        min: 1,
                        message: t("product.validation.sizeMin"),
                      },
                      {
                        max: 5,
                        message: t("product.validation.sizeMax"),
                      },
                    ]}
                    placeholder={t("product.validation.placeholderSize")}
                  />
                  <FormInput
                    {...restField}
                    label={t("product.color")}
                    name={[name, "color"]}
                    rules={[
                      { required: true, message: t("product.validation.colorRequired") },
                      {
                        max: 15,
                        message: t("product.validation.colorMax"),
                      },
                    ]}
                    placeholder={t("product.validation.placeholderColor")}
                  />
                  <FormInput
                    {...restField}
                    label={t("product.price")}
                    name={[name, "price"]}
                    rules={[{ required: true, message: t("product.validation.priceRequired") }]}
                    type="number"
                    min={0}
                  />
                  <FormInput
                    {...restField}
                    label={t("product.stock")}
                    name={[name, "stock"]}
                    rules={[{ required: true, message: t("product.validation.stockRequired") }]}
                    type="number"
                    min={0}
                  />
                  <FormInput
                    {...restField}
                    label={t("product.sku")}
                    name={[name, "sku"]}
                    placeholder={t("product.validation.placeholderSku")}
                  />
                  <AntUpload
                    {...restField}
                    name={[name, "image"]}
                  />
                  <Form.Item label=" ">
                    <AntButton
                      danger
                      icon={<DeleteOutlined />}
                      disabled={fields.length === 1}
                      onClick={() => remove(name)}
                    />
                  </Form.Item>
                </div>
              ))}

              <Form.ErrorList errors={errors} />
            </Flex>
          )}
        </Form.List>

        <FormInput label={t("product.description")} name="description" textarea />
      </Form>
    </Modal>
  );
};
