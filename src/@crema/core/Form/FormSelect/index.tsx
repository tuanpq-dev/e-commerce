import { Form } from "antd";
import type { Rule } from "antd/es/form";
import type { SelectProps } from "antd";
import AntSelect from "../../../component/AntSelect";
import type { CategoryType } from "../../../../types/domain";

type FormSelectProps = SelectProps & {
  label: string;
  name: string;
  options: CategoryType[];
  rules?: Rule[];
};

const FormSelect = ({ label, name, options, rules, ...props }: FormSelectProps) => {
  const selectOptions = options.map((option) => ({
    value: option.name,
    label: option.name,
  }));

  return (
    <Form.Item label={label} name={name} rules={rules}>
      <AntSelect options={selectOptions} {...props} />
    </Form.Item>
  );
};

export default FormSelect;
