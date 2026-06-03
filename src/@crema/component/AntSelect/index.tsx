import { Select } from "antd";
import type { SelectProps } from "antd";

const AntSelect = ({ options, ...props }: SelectProps) => {
  return <Select options={options} {...props} />;
};

export default AntSelect;
