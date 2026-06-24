import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Descriptions,
  Empty,
  Spin,
  Table,
  Tag,
  type TableProps,
} from "antd";

import { GetOrders } from "../../api/orderApi";
import { GetCustomers } from "../../api/customerApi";
import type { CustomerType, OrderType } from "../../types/domain";
import formatCurrency from "../../utils/formatCurrecy";
import formatDate from "../../utils/formatDate";
import { useTranslation } from "react-i18next";
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
      const [{ data: dataCustomers }, { data: dataOrders }] = await Promise.all(
        [GetCustomers(1, 99), GetOrders(1, 99)],
      );
      const customerData = (dataCustomers ?? []).find(
        (item: CustomerType) => String(item.id) === id,
      );
      const customerOrders = (dataOrders ?? []).filter(
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDataDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusOrder = useMemo(() => getOrderStatuses(t), [t]);

  const columns: TableProps<OrderType>["columns"] = [
    {
      title: t("order.columns.code"),
      dataIndex: "order_code",
      key: "order_code",
    },
    {
      title: t("customer.detail.orderCreatedAt"),
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) => formatDate(created_at),
    },
    {
      title: t("order.columns.totalPrice"),
      dataIndex: "total_price",
      key: "total_price",
      render: (totalPrice) => formatCurrency(Number(totalPrice ?? 0)),
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

  if (loading) return <Spin />;
  if (!customer) return <Empty description={t("customer.detail.notFound")} />;

  const totalExpend = orders.reduce((total, order) => {
    return total + Number(order.total_price ?? 0);
  }, 0);

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
            dataSource={orders.reverse()}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
    </Card>
  );
};

export default DetailCustomer;
