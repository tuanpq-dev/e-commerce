import { Form, Modal } from "antd";
import type { CreateCustomerValues } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import { useTranslation } from "react-i18next";

type ModalCustomerProps = {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: (values: CreateCustomerValues) => void;
};

export const ModalCustomer = ({
  open,
  loading,
  onCancel,
  onOk,
}: ModalCustomerProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  return (
    <Modal
      title={t("customer.titleCreate")}
      open={open}
      confirmLoading={loading}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (visible) {
          form.resetFields();
        }
      }}
      afterClose={() => form.resetFields()}
      okText={t("common.add")}
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
