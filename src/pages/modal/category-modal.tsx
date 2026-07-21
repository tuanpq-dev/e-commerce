import { useEffect } from "react";
import { Form, Modal, Select } from "antd";
import type { CategoryType } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import { useTranslation } from "react-i18next";

type ModalCategoryProps = {
  isUpdate?: boolean;
  initialValue?: CategoryType | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: CategoryType) => void;
  parentOptions?: CategoryType[];
};

export const ModalCategory = ({
  initialValue,
  isUpdate,
  open,
  onOk,
  onCancel,
  parentOptions,
}: ModalCategoryProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isChild = !!parentOptions;

  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      form.setFieldsValue(initialValue);
      return;
    }
    form.resetFields();
  }, [form, initialValue, open]);

  const getTitle = () => {
    if (isChild) return t("category.titleCreateChild") || "Thêm danh mục con";
    return isUpdate ? t("category.titleUpdateParent") : t("category.titleCreateParent");
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      okText={isUpdate ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
    >
      <Form form={form} layout="vertical">
        {isChild && (
          <Form.Item
            label={t("category.name") || "Danh mục cha"}
            name="parentId"
            rules={[
              {
                required: true,
                message: t("category.validation.parentRequired") || "Vui lòng chọn danh mục cha!",
              },
            ]}
          >
            <Select
              placeholder={t("category.placeholder.selectParent") || "Chọn danh mục cha..."}
              options={(parentOptions ?? [])
                .filter((c) => !c.parentId)
                .map((c) => ({ value: c.id, label: c.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        )}

        <FormInput
          label={isChild ? (t("category.childName") || "Tên danh mục con") : t("category.name")}
          name="name"
          rules={[
            {
              required: true,
              message: isChild
                ? (t("category.validation.childNameRequired") || "Vui lòng nhập tên!")
                : t("category.validation.nameRequired"),
            },
            { min: 1, message: t("category.validation.nameMin") },
            { max: 30, message: t("category.validation.nameMax") },
          ]}
        />
      </Form>
    </Modal>
  );
};
