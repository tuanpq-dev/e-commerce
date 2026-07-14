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
import type { CustomerOrderResponseType } from "../../types/domain";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import formatDate from "../../utils/formatDate";
import formatCurrency from "../../utils/formatCurrecy";
import { getOrderStatuses } from "../../shared/constant/orderStatus";

const DetailCustomer = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [dataCustomer, setDataCustomer] = useState<CustomerOrderResponseType | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDataDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await axiosClient.get<CustomerOrderResponseType>(`/customer/${id}`);
      setDataCustomer(data);
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

  const columns: TableProps["columns"] = [
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

  if (loading) return <Spin />;
  if (!dataCustomer) return <Empty description={t("customer.detail.notFound")} />;

  return (
    <Card title={t("customer.detail.title")}>
      <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
        <Descriptions.Item label={t("customer.fullname")}>
          {dataCustomer.fullname}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.email")}>
          {dataCustomer.email}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.phone")}>
          {dataCustomer.phone}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.columns.totalOrders")}>
          {dataCustomer.orders.length}
        </Descriptions.Item>
        <Descriptions.Item label={t("customer.columns.totalExpend")}>
          {formatCurrency(dataCustomer.totalExpend)}
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
            dataSource={dataCustomer.orders}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
    </Card>
  );
};

export default DetailCustomer;
