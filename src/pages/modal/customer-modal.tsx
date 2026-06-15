import { Form, Modal } from "antd";
import type { CreateCustomerValues } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";

type ModalCustomerProps = {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: (values: CreateCustomerValues) => void;
};

export const ModalCustomer = ({
  open,
  loading,
  onCancel,
  onOk,
}: ModalCustomerProps) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="Thêm mới khách hàng"
      open={open}
      confirmLoading={loading}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (visible) {
          form.resetFields();
        }
      }}
      afterClose={() => form.resetFields()}
      okText="Thêm mới"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormInput
          label="Họ tên"
          name="fullname"
          rules={[
            { required: true, message: "Vui lòng nhập họ tên" },
            { min: 2, message: "Họ tên tối thiểu 2 ký tự" },
            { max: 60, message: "Họ tên tối đa 60 ký tự" },
          ]}
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        />
        <FormInput
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^[0-9]{9,11}$/,
              message: "Số điện thoại phải có 9-11 chữ số",
            },
          ]}
        />
        <FormInput label="Địa chỉ" name="address" textarea />
      </Form>
    </Modal>
  );
};
