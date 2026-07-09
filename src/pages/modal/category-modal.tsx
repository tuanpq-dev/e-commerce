import { useEffect } from "react";
import { Form, Modal } from "antd";
import type { CategoryType } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      title={
        isUpdate
          ? t("category.titleUpdateParent")
          : t("category.titleCreateParent")
      }
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
        <FormInput
          label={t("category.name")}
          name="name"
          rules={[
            { required: true, message: t("category.validation.nameRequired") },
            {
              min: 1,
              message: t("category.validation.nameMin"),
            },
            {
              max: 30,
              message: t("category.validation.nameMax"),
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
  const { t } = useTranslation();
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
      title={
        isUpdate
          ? t("category.titleUpdateChild")
          : t("category.titleCreateChild")
      }
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
        <FormInput
          label={t("category.childName")}
          name="name"
          rules={[
            {
              required: true,
              message: t("category.validation.childNameRequired"),
            },
            {
              min: 1,
              message: t("category.validation.childNameMin"),
            },
            {
              max: 30,
              message: t("category.validation.childNameMax"),
            },
          ]}
        />

        {!isUpdate && (
          <FormSelect
            label={t("category.name")}
            name="parentId"
            options={parentOptions}
            placeholder={t("category.placeholder.selectParent")}
            rules={[
              {
                required: true,
                message: t("category.validation.parentRequired"),
              },
            ]}
          />
        )}
      </Form>
    </Modal>
  );
};
