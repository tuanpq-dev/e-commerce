import { Card, Col, Row } from "antd";

const Dashboard = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card title="Doanh thu theo tháng">
          <img
            alt="Revenue chart"
            src="https://quickchart.io/chart?width=500&height=300&c={type:'line',data:{labels:['Jan','Feb','Mar','Apr','May','Jun'],datasets:[{label:'Revenue',data:[120,190,300,500,420,650]}]}}"
            style={{ width: "100%" }}
          />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Đơn hàng theo trạng thái">
          <img
            alt="Order status chart"
            src="https://quickchart.io/chart?width=500&height=300&c={type:'doughnut',data:{labels:['Pending','Shipping','Completed','Cancelled'],datasets:[{data:[30,45,120,12]}]}}"
            style={{ width: "100%" }}
          />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Sản phẩm bán chạy">
          <img
            alt="Top products chart"
            src="https://quickchart.io/chart?width=500&height=300&c={type:'bar',data:{labels:['Áo','Quần','Giày','Túi','Mũ'],datasets:[{label:'Sold',data:[80,65,50,40,25]}]}}"
            style={{ width: "100%" }}
          />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Tỷ lệ danh mục">
          <img
            alt="Category chart"
            src="https://quickchart.io/chart?width=500&height=300&c={type:'pie',data:{labels:['Fashion','Shoes','Accessories','Beauty'],datasets:[{data:[45,25,20,10]}]}}"
            style={{ width: "100%" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
