import { Form, type InputProps } from "antd";
import AntInput from "../../../component/AntInput";

type FormInputProps = InputProps & {
  label: string;
  name: string;
};

const FormInput = ({ name, label, ...attrs }: FormInputProps) => {
  const placeholderShow = `Nhập ${label.toLowerCase()}`;

  return (
    <Form.Item name={name} label={label}>
      <AntInput placeholder={placeholderShow} {...attrs} />
    </Form.Item>
  );
};

export default FormInput;
