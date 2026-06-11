import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Empty,
  Spin,
  Table,
  Tag,
  type TableProps,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { GetOrders } from "../../api/orderApi";
import { GetCustomers } from "../../api/customerApi";
import type { CustomerType, OrderType } from "../../types/domain";
import formatCurrency from "../../utils/formatCurrecy";

const statusOrder = [
  {
    status: "completed",
    icon: <CheckCircleOutlined />,
    title: "Thành công",
    color: "green",
  },
  {
    status: "processing",
    icon: <ClockCircleOutlined />,
    title: "Đang xử lý",
    color: "blue",
  },
  {
    status: "pending",
    icon: <ClockCircleOutlined />,
    title: "Đang xử lý",
    color: "yellow",
  },
  {
    status: "cancelled",
    icon: <CloseCircleOutlined />,
    title: "Đã hủy",
    color: "red",
  },
];

const DetailCustomer = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDataDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [customers, dataOrder] = await Promise.all([
        GetCustomers(),
        GetOrders(),
      ]);
      const customerData = (customers ?? []).find(
        (item: CustomerType) => String(item.id) === id,
      );
      const customerOrders = (dataOrder ?? []).filter(
        (item: OrderType) => String(item.customer_id) === id,
      );

      setCustomer(customerData ?? null);
      setOrders(customerOrders);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataDetail();
  }, [id]);

  const columns: TableProps<OrderType>["columns"] = [
    {
      title: "Mã đơn",
      dataIndex: "order_code",
      key: "order_code",
    },
    {
      title: "Ngày tạo đơn",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (totalPrice) => formatCurrency(Number(totalPrice ?? 0)),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const item = statusOrder.find((item) => item.status === status);
        if (!item) return <Tag>{status}</Tag>;

        return (
          <Tag key={item.status} icon={item.icon} color={item.color}>
            {item.title}
          </Tag>
        );
      },
    },
  ];

  if (loading) return <Spin />;
  if (!customer) return <Empty description="Không tìm thấy khách hàng" />;

  const totalExpend = orders.reduce((total, order) => {
    return total + Number(order.total_price ?? 0);
  }, 0);

  return (
    <Card title="Chi tiết khách hàng">
      <Descriptions column={2} bordered>
        <Descriptions.Item label="Tên">{customer.fullname}</Descriptions.Item>
        <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {customer.phone}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng số đơn">
          {orders.length}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng chi tiêu">
          {formatCurrency(totalExpend)}
        </Descriptions.Item>
      </Descriptions>

      <Card
        title="Danh sách đơn hàng"
        style={{
          marginTop: 24,
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          pagination={false}
        />
      </Card>
    </Card>
  );
};

export default DetailCustomer;
