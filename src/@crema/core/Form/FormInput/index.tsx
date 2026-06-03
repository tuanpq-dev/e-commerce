import { Form, type FormItemProps, type InputProps } from "antd";
import AntInput from "../../../component/AntInput";

type FormInputProps = InputProps & {
  label: string;
  name: string;
  required?: boolean;
  rules?: FormItemProps["rules"];
};

const FormInput = ({ name, label, rules = [], ...attrs }: FormInputProps) => {
  const placeholderShow = `Nhập ${label.toLowerCase()}`;

  return (
    <Form.Item name={name} label={label} rules={rules}>
      <AntInput placeholder={placeholderShow} {...attrs} />
    </Form.Item>
  );
};

export default FormInput;
