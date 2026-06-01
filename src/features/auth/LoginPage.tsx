import { Button, Checkbox, Form, Input } from "antd";
import type { FieldType } from "../../types/domain";
import { useNavigate } from "react-router-dom";
import { mockApiLogin } from "../../api/mockApi";
import "./Login.css";
type LoginType = {
  username: string;
  password: string;
  remember?: boolean;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const handleSubmit = async (values: LoginType) => {
    try {
      const res = await mockApiLogin(values.username, values.password);

      const storage = localStorage;

      storage.setItem("accessToken", res.accessToken);
      storage.setItem("user", JSON.stringify(res.user));

      navigate("/dash-board");
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
        <Form.Item<FieldType>
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password />
        </Form.Item>

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
