import { Form } from "antd";
import type { Rule } from "antd/es/form";
import type { SelectProps } from "antd";
import AntSelect from "../../../component/AntSelect";
import type { CategoryType } from "../../../../types/domain";
import type { ReactNode } from "react";

type FormSelectProps = SelectProps & {
  label?: string;
  name?: string;
  options: (CategoryType & {
    value?: string | number;
    label?: ReactNode;
  })[];
  rules?: Rule[];
};

const FormSelect = ({
  label,
  name,
  options,
  rules,
  ...props
}: FormSelectProps) => {
  return (
    <Form.Item label={label} name={name} rules={rules}>
      <AntSelect options={options} {...props} />
    </Form.Item>
  );
};

export default FormSelect;
