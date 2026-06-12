import { Form, Input, type FormItemProps, type InputProps } from "antd";
import type { ComponentProps } from "react";
import AntInput from "../../../component/AntInput";

type FormInputProps = Omit<InputProps, "name"> & {
  label: string;
  name: FormItemProps["name"];
  required?: boolean;
  rules?: FormItemProps["rules"];
  textarea?: boolean;
};

const FormInput = ({
  name,
  label,
  rules = [],
  textarea,
  ...attrs
}: FormInputProps) => {
  const placeholderShow = `Nhập ${label.toLowerCase()}`;

  return (
    <Form.Item name={name} label={label} rules={rules}>
      {textarea ? (
        <Input.TextArea
          placeholder={placeholderShow}
          {...(attrs as ComponentProps<typeof Input.TextArea>)}
        />
      ) : (
        <AntInput placeholder={placeholderShow} {...attrs} />
      )}
    </Form.Item>
  );
};

export default FormInput;
