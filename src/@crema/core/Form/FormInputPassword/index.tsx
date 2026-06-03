import { Form, type FormItemProps, type InputProps } from "antd";
import AntInputPassword from "../../../component/AntInputPassword";

type FormInputProps = InputProps & {
  label: string;
  name: string;
  required?: boolean;
  rules?: FormItemProps["rules"];
};

const FormInputPassword = ({
  name,
  label,
  rules = [],
  ...attrs
}: FormInputProps) => {
  const placeholderShow = `Nhập ${label.toLowerCase()}`;

  return (
    <Form.Item name={name} label={label} rules={rules}>
      <AntInputPassword placeholder={placeholderShow} {...attrs} />
    </Form.Item>
  );
};

export default FormInputPassword;
