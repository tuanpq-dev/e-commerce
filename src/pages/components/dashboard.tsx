import { Card, Col, Row } from "antd";

const chartCards = [
  {
    title: "Doanh thu theo tháng",
    alt: "Revenue chart",
    src: "https://quickchart.io/chart?width=500&height=300&c={type:'line',data:{labels:['Jan','Feb','Mar','Apr','May','Jun'],datasets:[{label:'Revenue',data:[120,190,300,500,420,650]}]}}",
  },
  {
    title: "Đơn hàng theo trạng thái",
    alt: "Order status chart",
    src: "https://quickchart.io/chart?width=500&height=300&c={type:'doughnut',data:{labels:['Pending','Shipping','Completed','Cancelled'],datasets:[{data:[30,45,120,12]}]}}",
  },
  {
    title: "Sản phẩm bán chạy",
    alt: "Top products chart",
    src: "https://quickchart.io/chart?width=500&height=300&c={type:'bar',data:{labels:['Áo','Quần','Giày','Túi','Mũ'],datasets:[{label:'Sold',data:[80,65,50,40,25]}]}}",
  },
  {
    title: "Tỷ lệ danh mục",
    alt: "Category chart",
    src: "https://quickchart.io/chart?width=500&height=300&c={type:'pie',data:{labels:['Fashion','Shoes','Accessories','Beauty'],datasets:[{data:[45,25,20,10]}]}}",
  },
];

const Dashboard = () => {
  return (
    <Row className="dashboard-grid" gutter={[16, 16]}>
      {chartCards.map((chart) => (
        <Col key={chart.alt} xs={24} md={12}>
          <Card className="dashboard-card" title={chart.title}>
            <img className="dashboard-chart" alt={chart.alt} src={chart.src} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Dashboard;
