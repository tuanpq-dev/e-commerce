import { useState } from "react";
import { Button, Checkbox, Form } from "antd";
import type { FieldType, RegisterPayload } from "../../types/domain";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import FormInput from "../../@crema/core/Form/FormInput";
import { EMAIL_REGEX } from "../../shared/constant/Regex";
import FormInputPassword from "../../@crema/core/Form/FormInputPassword";
import { useAuth } from "../../contexts/AuthContext";
import ThemeToggle from "../../@crema/component/ThemeToggle";

type LoginType = {
  email: string;
  password: string;
  remember?: boolean;
};

const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLoginSubmit = async (values: LoginType) => {
    try {
      await login(values);
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
    }
  };

  const handleRegisterSubmit = async (values: RegisterPayload) => {
    try {
      await register(values);
      setIsRegister(false);
      loginForm.setFieldsValue({
        email: values.email,
        password: "",
      });
      registerForm.resetFields();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-panel">
        <div className="login-header">
          <h1>{isRegister ? "Đăng ký" : "Sign in"}</h1>
          <p>{isRegister ? "Tạo tài khoản e-commerce mới" : "Access your e-commerce dashboard"}</p>
        </div>

        {!isRegister ? (
          <Form
            form={loginForm}
            name="login"
            layout="vertical"
            className="login-form"
            autoComplete="off"
            onFinish={handleLoginSubmit}
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

            <div className="login-toggle">
              Chưa có tài khoản?{" "}
              <span onClick={() => setIsRegister(true)} className="login-toggle-link">
                Đăng ký ngay
              </span>
            </div>
          </Form>
        ) : (
          <Form
            form={registerForm}
            name="register"
            layout="vertical"
            className="login-form"
            autoComplete="off"
            onFinish={handleRegisterSubmit}
          >
            <FormInput
              label="Họ và tên"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập họ và tên!",
                },
                {
                  max: 50,
                  message: "Họ và tên tối đa 50 ký tự",
                },
              ]}
            />

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
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                {
                  min: 6,
                  message: "Mật khẩu chứa ít nhất 6 ký tự!",
                },
                {
                  max: 50,
                  message: "Mật khẩu tối đa 50 ký tự",
                },
              ]}
            />

            <Form.Item label={null}>
              <Button type="primary" htmlType="submit" block size="large">
                Đăng ký
              </Button>
            </Form.Item>

            <div className="login-toggle">
              Đã có tài khoản?{" "}
              <span onClick={() => setIsRegister(false)} className="login-toggle-link">
                Đăng nhập ngay
              </span>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
