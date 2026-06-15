import {
  Card,
  Descriptions,
  Empty,
  Form,
  Image,
  Spin,
  Table,
  Timeline,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GetOrderById, UpdateStatusDetailOrder } from "../../api/orderApi";
import { CreateActiveLog } from "../../api/activeLogApi";
import formatCurrency from "../../utils/formatCurrecy";
import FormSelect from "../../@crema/core/Form/FormSelect";
import formatDate from "../../utils/formatDate";
import { useAuth } from "../../contexts/AuthContext";

type OrderItemType = {
  id: string;
  product_id: string;
  product_name: string;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
};

type OrderHistoryType = {
  status: string;
  message: string;
  createdAt: string;
  updatedBy?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
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
  status: "pending" | "processing" | "shipping" | "completed" | "cancelled";
  shipping_address: string;
  items: OrderItemType[];
  histories?: OrderHistoryType[];
  historyDetailOrder?: OrderHistoryType[];
};

// Định nghĩa các transition hợp lệ
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipping"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
};

const ALL_STATUSES = Object.keys(STATUS_TRANSITIONS) as Array<
  keyof typeof STATUS_CONFIG
>;

const STATUS_CONFIG = {
  pending: { label: "Chờ xử lý", color: "#d46b08", bg: "#fff7e6" },
  processing: { label: "Đang xử lý", color: "#096dd9", bg: "#e6f4ff" },
  shipping: { label: "Đang giao", color: "#7c3aed", bg: "#f5f3ff" },
  completed: { label: "Hoàn thành", color: "#389e0d", bg: "#f6ffed" },
  cancelled: { label: "Đã hủy", color: "#cf1322", bg: "#fff1f0" },
};

const StatusBadge = ({ value }: { value: string }) => {
  const cfg = STATUS_CONFIG[value as keyof typeof STATUS_CONFIG];
  if (!cfg) return null;

  return (
    <span
      style={{
        color: cfg.color,
        background: cfg.bg,
        padding: "2px 10px",
        borderRadius: 999,
        fontWeight: 600,
      }}
    >
      ● {cfg.label}
    </span>
  );
};

const DetailOrder = () => {
  const { userInfo } = useAuth();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [data, setData] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const dataDetailOrder = await GetOrderById(id);
      setData(dataDetailOrder);
      form.setFieldsValue({ status: dataDetailOrder?.status });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: "Màu",
      dataIndex: "color",
      key: "color",
      width: 100,
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

  const handleUpdateStatus = async (status: string) => {
    if (!data?.id) return;

    const updatedOrder = await UpdateStatusDetailOrder({
      id: data.id,
      status,
      historyDetailOrder: data.historyDetailOrder ?? [],
      updatedBy: {
        id: userInfo?.id,
        name: userInfo?.name,
        email: userInfo?.email,
      },
    });

    await CreateActiveLog({
      module: `Detail Order - Status - ${id}`,
      action: "UPDATE",
      user: userInfo?.name,
    });

    setData(updatedOrder);
  };

  if (loading) return <Spin />;
  if (!data) return <Empty description="Không tìm thấy đơn hàng" />;

  return (
    <Form form={form}>
      <Card title={`Chi tiết đơn hàng ${data.order_code}`} loading={loading}>
        <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
          <Descriptions.Item label="Mã đơn">
            {data.order_code}
          </Descriptions.Item>

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

          <Descriptions.Item label="Trạng thái đơn hàng">
            <FormSelect
              name="status"
              onChange={handleUpdateStatus}
              labelRender={({ value }) => <StatusBadge value={String(value)} />}
              options={ALL_STATUSES.map((s) => ({
                label: STATUS_CONFIG[s].label,
                value: s,
                disabled:
                  s !== data.status &&
                  !STATUS_TRANSITIONS[data.status]?.includes(s),
              }))}
            />
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
          <div className="table-shell">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.items}
              pagination={false}
              scroll={{ x: "max-content" }}
            />
          </div>
        </Card>

        <Card
          title="Lịch sử trạng thái"
          style={{
            marginTop: 24,
          }}
        >
          <Timeline
            reverse={true}
            items={(data.historyDetailOrder ?? []).map((item) => ({
              children: (
                <div>
                  <div>
                    {item.updatedBy?.name ?? "System"},{" "}
                    {item.message.toLowerCase()}
                  </div>
                  <div style={{ color: "#999", fontSize: 13 }}>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      </Card>
    </Form>
  );
};

export default DetailOrder;
