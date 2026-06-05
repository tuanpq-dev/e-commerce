import {
  Card,
  Descriptions,
  Empty,
  Image,
  Spin,
  Table,
  Tag,
  Timeline,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GetOrderByOrderCode } from "../../api/orderApi";
import formatCurrency from "../../utils/formatCurrecy";

type OrderItemType = {
  id: string;
  product_id: string;
  product_name: string;
  image: string;
  quantity: number;
  price: number;
};

type OrderHistoryType = {
  id: string;
  status: string;
  title: string;
  time: string;
};

type OrderType = {
  id: string;
  order_code: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  total_price: number;
  payment_method: string;
  payment_status: "paid" | "unpaid";
  shipping_status: "pending" | "shipping" | "delivered";
  status: "success" | "processing" | "cancelled";
  shipping_address: string;
  items: OrderItemType[];
  histories?: OrderHistoryType[];
};

const DetailOrder = () => {
  const { order_code } = useParams();

  const [data, setData] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!order_code) return;

    try {
      setLoading(true);

      const dataDetailOrder = await GetOrderByOrderCode(order_code);

      setData(dataDetailOrder);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [order_code]);

  const columns: TableProps<OrderItemType>["columns"] = [
    {
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image: string) => <Image width={50} height={50} src={image} />,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${formatCurrency(price)}`,
    },
    {
      title: "Tổng tiền",
      key: "total",
      render: (_, record) =>
        `${formatCurrency(record.price * record.quantity)}`,
    },
  ];

  if (loading) return <Spin />;
  if (!data) return <Empty description="Không tìm thấy đơn hàng" />;

  return (
    <Card title={`Chi tiết đơn hàng ${data.order_code}`} loading={loading}>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="Mã đơn">{data.order_code}</Descriptions.Item>

        <Descriptions.Item label="Ngày mua">
          {data.created_at}
        </Descriptions.Item>

        <Descriptions.Item label="Tên khách hàng">
          {data.customer_name}
        </Descriptions.Item>

        <Descriptions.Item label="Email">
          {data.customer_email}
        </Descriptions.Item>

        <Descriptions.Item label="Địa chỉ giao hàng">
          {data.shipping_address}
        </Descriptions.Item>

        <Descriptions.Item label="Phương thức thanh toán">
          {data.payment_method}
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái thanh toán">
          {data.payment_status === "paid" ? (
            <Tag color="success">Đã thanh toán</Tag>
          ) : (
            <Tag color="warning">Chưa thanh toán</Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái đơn hàng">
          {data.status === "success" && <Tag color="success">Thành công</Tag>}
          {data.status === "processing" && (
            <Tag color="processing">Đang xử lý</Tag>
          )}
          {data.status === "cancelled" && <Tag color="error">Đã hủy</Tag>}
        </Descriptions.Item>

        <Descriptions.Item label="Tổng tiền">
          {formatCurrency(data.total_price)}
        </Descriptions.Item>
      </Descriptions>

      <Card
        title="Danh sách sản phẩm"
        style={{
          marginTop: 24,
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data.items}
          pagination={false}
        />
      </Card>

      <Card
        title="Lịch sử trạng thái"
        style={{
          marginTop: 24,
        }}
      >
        <Timeline
          items={(data.histories ?? []).map((item) => ({
            children: (
              <div>
                <div>{item.title}</div>
                <div style={{ color: "#999", fontSize: 13 }}>{item.time}</div>
              </div>
            ),
          }))}
        />
      </Card>
    </Card>
  );
};

export default DetailOrder;
