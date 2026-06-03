import { Input, type InputProps } from "antd";
type AntInputProps = InputProps;

const AntInputPassword = (props: AntInputProps) => {
  return <Input.Password {...props} />;
};

export default AntInputPassword;
