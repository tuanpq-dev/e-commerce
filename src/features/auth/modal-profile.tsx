import { Form, type FormInstance } from "antd";
import { useEffect } from "react";
import FormInput from "../../@crema/core/Form/FormInput";
import type { UpdateUserPayload } from "../../types/domain";

type ModalProfileProps = {
  form: FormInstance<UpdateUserPayload>;
  initialValues: UpdateUserPayload;
  isUpdate: boolean;
};

const ModalProfile = ({ form, initialValues, isUpdate }: ModalProfileProps) => {
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  return (
    <Form form={form} layout="vertical">
      <FormInput label="Tên" name="name" />
      <FormInput label="Email" name="email" disabled={isUpdate} />
      <FormInput label="Số điện thoại" name="phone" />
    </Form>
  );
};

export default ModalProfile;
