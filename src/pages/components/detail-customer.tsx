import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Descriptions,
  Spin,
  Table,
  Tag,
  Empty,
  type TableProps,
} from "antd";
import type { OrderType, CustomerType } from "../../types/domain";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import formatDate from "../../utils/formatDate";
import formatCurrency from "../../utils/formatCurrecy";
import { getOrderStatuses } from "../../shared/constant/orderStatus";

const DetailCustomer = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDataDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/order/${id}`);
      setOrders([data]);
      setCustomer({
        id: data.customerId,
        fullname: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone || data.customer_phone,
        address: data.shippingAddress,
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusOrder = useMemo(() => getOrderStatuses(t), [t]);

  const columns: TableProps<OrderType>["columns"] = [
    {
      title: t("order.columns.code"),
      dataIndex: "orderCode",
      key: "orderCode",
      render: (_value, record) => record.orderCode || record.order_code,
    },
    {
      title: t("customer.detail.orderCreatedAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (_value, record) => {
        const date = record.createdAt || record.created_at;
        return date ? formatDate(date as string) : "";
      },
    },
    {
      title: t("order.columns.totalPrice"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (_value, record) => {
        const price = record.totalPrice !== undefined ? record.totalPrice : record.total_price;
        return formatCurrency(Number(price ?? 0));
      },
    },
    {
      title: t("order.columns.status"),
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

  const totalExpend = useMemo(() => {
    return orders.reduce((total, order) => {
      const price = order.totalPrice !== undefined ? order.totalPrice : order.total_price;
      return total + Number(price ?? 0);
    }, 0);
  }, [orders]);

  if (loading) return <Spin />;
  if (!customer) return <Empty description={t("customer.detail.notFound")} />;

  return (
    <Card title={t("customer.detail.title")}>
      <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
        <Descriptions.Item label={t("customer.fullname")}>
          {customer.fullname}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.email")}>
          {customer.email}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.phone")}>
          {customer.phone}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.columns.totalOrders")}>
          {orders.length}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.columns.totalExpend")}>
          {formatCurrency(totalExpend)}
        </Descriptions.Item>
      </Descriptions>

      <Card
        title={t("customer.detail.orderList")}
        style={{
          marginTop: 24,
        }}
      >
        <div className="table-shell">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={orders}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
    </Card>
  );
};

export default DetailCustomer;
