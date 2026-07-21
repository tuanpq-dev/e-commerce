import { Result } from "antd";
import "./css/403.css";

export const Page403 = () => {

  return (
    <div className="page-403-wrapper">
      <Result
        status="403"
        title={<span className="page-403-title">403</span>}
        subTitle={<span className="page-403-subtitle">Bạn không có quyền truy cập trang này.</span>}
        className="page-403-card"
      />
    </div>
  );
};

export default Page403;
