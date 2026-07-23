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
import type { DataType } from "../../types/domain";

type OrderItemType = {
  id: string | number;
  productId?: string | number;
  productName: string;
  image?: string;
  size?: string;
  color?: string;
  variantSku?: string;
  variantAttributes?: any;
  quantity: number;
  price: number | string;
};

type OrderHistoryType = {
  id?: string | number;
  orderId?: string | number;
  status: string;
  message: string;
  createdAt: string;
  updateBy?: string;
  user?: { fullname?: string };
};

type OrderType = {
  id: string | number;
  orderCode: string;
  customerId: string | number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    id?: number | string;
    fullname?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  createdAt: string;
  totalPrice?: number | string;
  paymentMethod: string;
  paymentStatus: string;
  shippingStatus: string;
  status: string;
  shippingAddress: string;
  items: OrderItemType[];
  history?: OrderHistoryType[];
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
  const normalizedKey = value.toLowerCase() as OrderStatusKey;
  const cfg = ORDER_STATUS_STYLE[normalizedKey] || ORDER_STATUS_STYLE[value as OrderStatusKey];
  if (!cfg) return <Tag>{label ?? value}</Tag>;

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

const resolveItemAttributeLabels = (
  item: OrderItemType,
  products: DataType[],
): string[] => {
  const attributes: string[] = [];

  if (item.size && item.size !== "-" && item.size !== "Default") {
    if (item.size.includes(" / ")) {
      attributes.push(...item.size.split(" / "));
    } else {
      attributes.push(item.size);
    }
  }
  if (item.color && item.color !== "Default" && item.color !== "-") {
    attributes.push(item.color);
  }
  if (attributes.length > 0) return attributes;

  const pId = (item as any).productId ?? (item as any).product_id;
  const product = products.find(
    (p) => String(p.id) === String(pId) || p.name === item.productName,
  );

  if (product) {
    const valueMap = new Map<string, string>();
    let attrDetails = (product as any).options || product.attributesDetails;
    if (typeof attrDetails === "string") {
      try {
        attrDetails = JSON.parse(attrDetails);
      } catch { }
    }
    if (attrDetails && typeof attrDetails === "object") {
      const groups = Array.isArray(attrDetails)
        ? attrDetails
        : Object.values(attrDetails);
      groups.forEach((g: any) => {
        (g?.values || []).forEach((v: any) => {
          if (v?.id != null && v?.value) {
            valueMap.set(String(v.id), String(v.value));
          }
        });
      });
    }

    const comboKey =
      item.variantAttributes?.comboKey ||
      item.variantAttributes?.attributes?.comboKey ||
      (item.variantSku?.includes("-") ? item.variantSku : undefined);

    if (comboKey) {
      const keys = String(comboKey).split("-");
      const resolved = keys
        .map((k) => valueMap.get(k))
        .filter((v): v is string => Boolean(v));
      if (resolved.length > 0) {
        return resolved;
      }
    }

    const vId = (item as any).variantId ?? (item as any).variant_id;
    if (vId && Array.isArray(product.variants)) {
      const v = product.variants.find(
        (varObj: any) => String(varObj.id) === String(vId),
      );
      if (v) {
        const vKey =
          (v as any).comboKey || (v as any).attributes?.comboKey || v.sku;
        if (vKey) {
          const keys = String(vKey).split("-");
          const resolved = keys
            .map((k) => valueMap.get(k))
            .filter((v): v is string => Boolean(v));
          if (resolved.length > 0) {
            return resolved;
          }
        }
      }
    }
  }

  if (item.variantSku) {
    return [item.variantSku];
  }

  return [];
};

const DetailOrder = () => {
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [data, setData] = useState<OrderType | null>(null);
  const [products, setProducts] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const orderStatuses = useMemo(() => getOrderStatuses(t), [t]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [dataOrder, productsRes] = await Promise.all([
        axiosClient.get<OrderType>(`/order/${id}`),
        axiosClient
          .post("/product/search", { page: 1, pageSize: 100 })
          .catch(() => null),
      ]);

      setData(dataOrder);
      if (dataOrder?.status) {
        form.setFieldsValue({ status: dataOrder.status.toLowerCase() });
      }

      if (productsRes) {
        const prodList = Array.isArray(productsRes)
          ? productsRes
          : (productsRes as any)?.data || [];
        setProducts(prodList);
      }
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
          const src = getProductImages(image || "")[0] || "";
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
          const attributes = resolveItemAttributeLabels(record, products);

          if (attributes.length === 0) return "-";

          return (
            <Space wrap>
              {attributes.map((attr, idx) => (
                <Tag color="blue" key={`${attr}-${idx}`}>
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
        render: (price: number | string) => `${formatCurrency(Number(price))}`,
      },
      {
        title: t("order.detail.columns.total"),
        key: "total",
        render: (_, record) =>
          `${formatCurrency(Number(record.price) * Number(record.quantity))}`,
      },
    ];
  }, [t, products]);

  const handleUpdateStatus = async (status: string) => {
    if (!data?.id) return;

    const payload = {
      status,
      updatedBy: {
        id: userInfo?.id,
        name: userInfo?.fullname,
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
      user: userInfo?.fullname || "",
    });

    if (updated) {
      setData(updated);
      form.setFieldsValue({ status: updated.status?.toLowerCase() });
    } else {
      await fetchData();
    }
  };

  if (loading) return <Spin />;
  if (!data) return <Empty description={t("order.detail.notFound")} />;

  const currentStatus = (data.status || "").toLowerCase();

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
            {data.customer.fullname}
          </Descriptions.Item>

          <Descriptions.Item label={t("customer.email")}>
            {data.customer?.email ?? data.customerEmail ?? "-"}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.shippingAddress")}>
            {data.shippingAddress || data.customer?.address || "-"}
          </Descriptions.Item>

          <Descriptions.Item label={t("order.detail.orderStatus")}>
            <FormSelect
              name="status"
              onChange={handleUpdateStatus}
              labelRender={({ value }) => {
                const valStr = String(value ?? "").toLowerCase();
                const found = orderStatuses.find(
                  (s) => s.status.toLowerCase() === valStr,
                );
                return (
                  <StatusBadge
                    value={valStr}
                    label={found?.title}
                  />
                );
              }}
              options={ORDER_STATUS_KEYS.map((s) => {
                const statusInfo = orderStatuses.find(
                  (o) => o.status.toLowerCase() === s,
                );
                return {
                  label: statusInfo?.title ?? s,
                  value: s,
                  disabled:
                    s !== currentStatus &&
                    !STATUS_TRANSITIONS[currentStatus]?.includes(s),
                };
              })}
            />
          </Descriptions.Item>

          <Descriptions.Item label={t("order.totalPrice")}>
            {formatCurrency(
              data.totalPrice != null
                ? Number(data.totalPrice)
                : (data.items ?? []).reduce(
                  (sum, item) =>
                    sum + Number(item.price) * Number(item.quantity),
                  0,
                ),
            )}
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
            items={(
              data.history ??
              data.histories ??
              data.historyDetailOrder ??
              []
            ).map((item) => {
              const statusObj = orderStatuses.find(
                (s) => s.status.toLowerCase() === item.status?.toLowerCase(),
              );
              return {
                children: (
                  <div>
                    <div>
                      {item.updateBy ?? item.user?.fullname ?? "Hệ thống"},{" "}
                      {(item.message || statusObj?.title || item.status).toLowerCase()}
                    </div>
                    <div style={{ color: "#999", fontSize: 13 }}>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                ),
              };
            })}
          />
        </Card>
      </Card>
    </Form>
  );
};

export default DetailOrder;
