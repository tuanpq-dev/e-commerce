import { Button, Checkbox, Form } from "antd";
import type { FieldType } from "../../types/domain";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import FormInput from "../../@crema/core/Form/FormInput";
import { EMAIL_REGEX } from "../../shared/constant/Regex";
import FormInputPassword from "../../@crema/core/Form/FormInputPassword";
import { useAuth } from "../../contexts/AuthContext";

type LoginType = {
  email: string;
  password: string;
  remember?: boolean;
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (values: LoginType) => {
    try {
      await login(values);

      navigate("/dashboard");
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-header">
          <h1>Sign in</h1>
          <p>Access your e-commerce dashboard</p>
        </div>
        <Form
          name="basic"
          layout="vertical"
          className="login-form"
          autoComplete="off"
          onFinish={handleSubmit}
        >
          <FormInput
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập email!",
              },
              {
                max: 50,
                message: "Email tối đa 50 ký tự",
              },
              { pattern: EMAIL_REGEX, message: "Email không đúng định dạng!" },
            ]}
          />

          <FormInputPassword
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập password!" },
              {
                max: 50,
                message: "Password tối đa 50 ký tự",
              },
            ]}
          />

          <Form.Item<FieldType>
            name="remember"
            valuePropName="checked"
            label={null}
          >
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Form.Item label={null}>
            <Button type="primary" htmlType="submit" block size="large">
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
