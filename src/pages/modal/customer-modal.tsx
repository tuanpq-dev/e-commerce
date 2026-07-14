import { Form, Modal } from "antd";
import type { CreateCustomerValues, CustomerType } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import { useTranslation } from "react-i18next";

type ModalCustomerProps = {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: (values: CreateCustomerValues) => void;
  initialValues?: CustomerType | null;
};

export const ModalCustomer = ({
  open,
  loading,
  onCancel,
  onOk,
  initialValues,
}: ModalCustomerProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  return (
    <Modal
      title={initialValues ? t("customer.titleUpdate") : t("customer.titleCreate")}
      open={open}
      confirmLoading={loading}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (visible) {
          if (initialValues) {
            form.setFieldsValue({
              fullname: initialValues.fullname,
              email: initialValues.email,
              phone: initialValues.phone,
              address: initialValues.address,
            });
          } else {
            form.resetFields();
          }
        }
      }}
      afterClose={() => form.resetFields()}
      okText={initialValues ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormInput
          label={t("customer.fullname")}
          name="fullname"
          rules={[
            {
              required: true,
              message: t("customer.validation.fullnameRequired"),
            },
            { min: 2, message: t("customer.validation.fullnameMin") },
            { max: 60, message: t("customer.validation.fullnameMax") },
          ]}
        />
        <FormInput
          label={t("customer.email")}
          name="email"
          type="email"
          rules={[
            {
              required: true,
              message: t("customer.validation.emailRequired"),
            },
            { type: "email", message: t("customer.validation.emailInvalid") },
          ]}
        />
        <FormInput
          label={t("customer.phone")}
          name="phone"
          rules={[
            {
              required: true,
              message: t("customer.validation.phoneRequired"),
            },
            {
              pattern: /^[0-9]{9,11}$/,
              message: t("customer.validation.phonePattern"),
            },
          ]}
        />
        <FormInput label={t("customer.address")} name="address" textarea />
      </Form>
    </Modal>
  );
};
