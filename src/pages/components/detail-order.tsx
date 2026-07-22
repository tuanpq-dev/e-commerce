import {
  Card,
  Descriptions,
  Empty,
  Form,
  Image,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
import axiosClient from "../../api/axiosClient";
import { getProductImages } from "../../utils/variantEngine";

type OrderItemType = {
  id: string;
  productId: string;
  productName: string;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
};

type OrderHistoryType = {
  id?: string | number;
  orderId?: string | number;
  status: string;
  message: string;
  createdAt: string;
  updateBy?: string;
};

type OrderType = {
  id: string | number;
  orderCode: string;
  customerId: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: "paid" | "unpaid";
  shippingStatus: "pending" | "shipping" | "delivered";
  status: "pending" | "processing" | "shipping" | "completed" | "cancelled";
  shippingAddress: string;
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
      const dataOrder = await axiosClient.get<OrderType>(`/order/${id}`);
      setData(dataOrder);
      form.setFieldsValue({ status: dataOrder?.status });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: TableProps<OrderItemType>["columns"] = useMemo(() => {
    return [
      {
        title: t("order.detail.columns.image"),
        dataIndex: "image",
        key: "image",
        render: (image: string) => {
          const src = getProductImages(image)[0] || "";
          return <Image width={50} height={50} src={src} />;
        },
      },
      {
        title: t("order.detail.columns.productName"),
        dataIndex: "productName",
        key: "productName",
      },
      {
        title: t("order.detail.columns.attributes"),
        key: "attributes",
        render: (_, record) => {
          const attributes = [];
          if (record.size && record.size !== "-") {
            if (record.size.includes(" / ")) {
              attributes.push(...record.size.split(" / "));
            } else {
              attributes.push(record.size);
            }
          }
          if (record.color && record.color !== "Default" && record.color !== "-") {
            attributes.push(record.color);
          }

          if (attributes.length === 0) return "-";

          return (
            <Space wrap>
              {attributes.map((attr) => (
                <Tag color="blue" key={attr}>
                  {attr}
                </Tag>
              ))}
            </Space>
          );
        },
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
  }, [t]);

  const handleUpdateStatus = async (status: string) => {
    if (!data?.id) return;

    const payload = {
      status,
      updatedBy: {
        id: userInfo?.id,
        name: userInfo.fullname,
        email: userInfo?.email,
      },
    };
    const updated = await axiosClient.patch<OrderType>(`/order/${data.id}`, payload);

    openNotification("success", {
      message: t("common.success"),
      description: t("order.notification.updateStatus"),
    });

    await CreateActiveLog({
      module: `Detail Order - Status - ${id}`,
      action: "UPDATE",
      user: userInfo.fullname,
    });

    setData(updated);
  };

  if (loading) return <Spin />;
  if (!data) return <Empty description={t("order.detail.notFound")} />;

  return (
    <Form form={form}>
      <Card title={`${t("order.detail.title")} ${data.orderCode}`} loading={loading}>
        <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
          <Descriptions.Item label={t("order.detail.orderCode")}>
            {data.orderCode}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.detail.purchasedAt")}>
            {formatDate(data.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.detail.customerName")}>
            {data.customerName}
          </Descriptions.Item>

          <Descriptions.Item label={t("customer.email")}>
            {data.customerEmail}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.shippingAddress")}>
            {data.shippingAddress}
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
            {formatCurrency(data.totalPrice)}
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
                    {item.updateBy ?? "System"},{" "}
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
