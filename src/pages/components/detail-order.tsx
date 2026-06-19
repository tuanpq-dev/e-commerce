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
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { GetOrderById, UpdateStatusDetailOrder } from "../../api/orderApi";
import { CreateActiveLog } from "../../api/activeLogApi";
import formatCurrency from "../../utils/formatCurrecy";
import FormSelect from "../../@crema/core/Form/FormSelect";
import formatDate from "../../utils/formatDate";
import { useAuth } from "../../contexts/AuthContext";
import openNotification from "../../@crema/core/Notification";
import { useTranslation } from "react-i18next";
import {
  ORDER_STATUS_KEYS,
  ORDER_STATUS_STYLE,
  getOrderStatuses,
  type OrderStatusKey,
} from "../../shared/constant/orderStatus";

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

// STATUS_TRANSITIONS: business logic – giữ nguyên
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipping"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
};

const StatusBadge = ({ value, label }: { value: string; label?: string }) => {
  const cfg = ORDER_STATUS_STYLE[value as OrderStatusKey];
  if (!cfg) return null;

  return (
    <span
      style={{
        color: cfg.colorHex,
        background: cfg.bg,
        padding: "2px 10px",
        borderRadius: 999,
        fontWeight: 600,
      }}
    >
      ● {label ?? value}
    </span>
  );
};

const DetailOrder = () => {
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [data, setData] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(false);
  const orderStatuses = useMemo(() => getOrderStatuses(t), [t]);

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
      title: t("order.detail.columns.image"),
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image: string) => <Image width={50} height={50} src={image} />,
    },
    {
      title: t("order.detail.columns.productName"),
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: t("order.detail.columns.size"),
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: t("order.detail.columns.color"),
      dataIndex: "color",
      key: "color",
      width: 100,
    },
    {
      title: t("order.detail.columns.quantity"),
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
    },
    {
      title: t("order.detail.columns.price"),
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${formatCurrency(price)}`,
    },
    {
      title: t("order.detail.columns.total"),
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

    openNotification("success", {
      message: t("common.success"),
      description: t("order.notification.updateStatus"),
    });

    await CreateActiveLog({
      module: `Detail Order - Status - ${id}`,
      action: "UPDATE",
      user: userInfo?.name,
    });

    setData(updatedOrder);
  };

  if (loading) return <Spin />;
  if (!data) return <Empty description={t("order.detail.notFound")} />;

  return (
    <Form form={form}>
      <Card title={`${t("order.detail.title")} ${data.order_code}`} loading={loading}>
        <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
          <Descriptions.Item label={t("order.detail.orderCode")}>
            {data.order_code}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.detail.purchasedAt")}>
            {data.created_at}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.detail.customerName")}>
            {data.customer_name}
          </Descriptions.Item>

          <Descriptions.Item label={t("customer.email")}>
            {data.customer_email}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.shippingAddress")}>
            {data.shipping_address}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.detail.orderStatus")}>
            <FormSelect
              name="status"
              onChange={handleUpdateStatus}
              labelRender={({ value }) => {
                const found = orderStatuses.find(
                  (s) => s.status === String(value),
                );
                return (
                  <StatusBadge
                    value={String(value)}
                    label={found?.title}
                  />
                );
              }}
              options={ORDER_STATUS_KEYS.map((s) => {
                const statusInfo = orderStatuses.find((o) => o.status === s);
                return {
                  label: statusInfo?.title ?? s,
                  value: s,
                  disabled:
                    s !== data.status &&
                    !STATUS_TRANSITIONS[data.status]?.includes(s),
                };
              })}
            />
          </Descriptions.Item>

          <Descriptions.Item label={t("order.totalPrice")}>
            {formatCurrency(data.total_price)}
          </Descriptions.Item>
        </Descriptions>

        <Card
          title={t("order.detail.productList")}
          style={{ marginTop: 24 }}
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
          title={t("order.detail.statusHistory")}
          style={{ marginTop: 24 }}
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
