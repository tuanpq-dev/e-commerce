import { Input } from "antd";
import type { InputProps } from "antd";

type AntInputProps = InputProps;

const AntInput = (props: AntInputProps) => {
  return <Input {...props} />;
};

export default AntInput;
