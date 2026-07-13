import {
  Flex,
  Grid,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from "antd";
import type React from "react";
import type {
  CreateOrderValues,
  DataType,
  OrderType,
  CustomerType,
} from "../../types/domain";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EyeOutlined } from "@ant-design/icons";
import formatCurrency from "../../utils/formatCurrecy";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from "../../config";
import { ModalCart } from "../modal";
import openNotification from "../../@crema/core/Notification";
import formatDate from "../../utils/formatDate";
import exportToCSV from "../../@crema/core/ExportToCSV";
import { useTranslation } from "react-i18next";
import { getOrderStatuses } from "../../shared/constant/orderStatus";
import { CreateOrder } from "../../api/orderApi";
import axiosClient from "../../api/axiosClient";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 5;

const Order: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const [data, setData] = useState<OrderType[]>([]);
  const [products, setProducts] = useState<DataType[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const navigate = useNavigate();
  const [isModalAdd, setIsModalAdd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalItems, setTotalItems] = useState(0);
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const statusOrder = useMemo(() => getOrderStatuses(t), [t]);

  const statusOptions = useMemo(
    () =>
      statusOrder.map(({ title, status }) => ({
        label: title,
        value: status,
      })),
    [statusOrder],
  );

  const fetchDataOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, meta } = await axiosClient.post(`/order/search`, {
        page: currentPage,
        pageSize,
      })
      setData(data);
      setTotalItems(meta.totalItems);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  const fetchCustomers = async () => {
    try {
      const { data } = await axiosClient.post("/customer/search");
      setCustomers(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: dataProduct } = await axiosClient.post('/product/search');
      const productCurrent = dataProduct.filter(
        (product) => product.status === "active",
      );
      setProducts(productCurrent);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOrderOptions = async () => {
    setIsLoadingOptions(true);
    try {
      await Promise.all([fetchProducts(), fetchCustomers()]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchDataOrder();
  }, [fetchDataOrder]);

  const columns: TableProps<OrderType>["columns"] = [
    {
      title: t("order.columns.no"),
      fixed: !isMobile ? "start" : false,
      width: 20,
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t("order.columns.code"),
      dataIndex: "orderCode",
      key: "orderCode",
      fixed: !isMobile ? "start" : false,
    },
    {
      title: t("order.columns.customer"),
      dataIndex: "customerName",
      key: "customerName",
      fixed: !isMobile ? "start" : false,
    },
    {
      title: t("order.columns.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => formatDate(createdAt),
    },
    {
      title: t("order.columns.totalPrice"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (_, record) => formatCurrency(Number(record.totalPrice)),
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
    {
      title: t("order.columns.action"),
      key: "action",
      fixed: !isMobile ? "end" : false,
      width: 100,
      align: "center",
      render: (_, record) => {
        return (
          <>
            <Space size="medium">
              <AntButton
                tooltip={t("order.tooltip.viewDetail")}
                icon={<EyeOutlined />}
                onClick={() => {
                  if (!record.id) return;

                  navigate(`/${config.routes.DETAIL_ORDER(record.id)}`);
                }}
              />
            </Space>
          </>
        );
      },
    },
  ];

  const handleAdd = async () => {
    setIsModalAdd(true);
    await fetchOrderOptions();
  };

  const handleCancel = () => {
    setIsModalAdd(false);
  };

  const getCreateOrderErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }

    return t("order.notification.createFailed");
  };

  const handleCreateOrder = async (values: CreateOrderValues) => {
    try {
      setIsCreating(true);
      await CreateOrder(values, customers, products);

      await fetchDataOrder();
      await fetchOrderOptions();

      setIsModalAdd(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("order.notification.createSuccess"),
      });
    } catch (err) {
      console.log(err);
      openNotification("error", {
        message: t("common.failed"),
        description: getCreateOrderErrorMessage(err),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatStatus = (status: string) => {
    const found = statusOrder.find((s) => s.status === status);
    return found?.title ?? status;
  };

  const exportData = data.map((d, index) => ({
    [t("order.exportColumns.no")]: index + 1,
    [t("order.exportColumns.orderCode")]: d.orderCode || d.order_code,
    [t("order.exportColumns.customerName")]: d.customerName || d.customer_name,
    [t("order.exportColumns.email")]: d.customerEmail || d.customer_email,
    [t("order.exportColumns.address")]: d.shippingAddress || d.shipping_address,
    [t("order.exportColumns.createdAt")]: (d.createdAt || d.created_at)
      ? formatDate(d.createdAt || d.created_at)
      : "",
    [t("order.exportColumns.totalPrice")]: formatCurrency(Number(d.totalPrice || d.total_price)),
    [t("order.exportColumns.status")]: d.status ? formatStatus(d.status) : "",
  }));

  const exportExcel = () => {
    return exportToCSV(exportData, "order.csv");
  };

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <div className="page-toolbar-controls">
            {/* <Search
              allowClear={true}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("order.placeholder.search")}
              className="page-search"
            /> */}
            <Select
              allowClear
              placeholder={t("order.placeholder.status")}
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="page-control"
            />
          </div>
          <Flex gap={10}>
            <AntButton
              tooltip={t("order.tooltip.exportExcel")}
              onClick={exportExcel}
            >
              {t("order.export")}
            </AntButton>
            {/* {isAdmin && ( */}
            <AntButton
              tooltip={t("common.add")}
              type="primary"
              onClick={handleAdd}
            >
              {t("common.add")}
            </AntButton>
            {/* )} */}
          </Flex>
        </div>
        <div className="table-shell">
          <Table<OrderType>
            rowKey={(record) => String(record.orderCode || record.id)}
            loading={isLoading}
            columns={columns}
            dataSource={data}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              showTotal: (total, range) =>
                t("order.pagination", {
                  count: range[1] - range[0] + 1,
                  total,
                }),
              onChange: (page, pageSize) => {
                setSearchParams({
                  _page: String(page),
                  _per_page: String(pageSize),
                });
              },
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Flex>

      <ModalCart
        open={isModalAdd}
        loading={isCreating}
        optionsLoading={isLoadingOptions}
        customers={customers}
        products={products}
        onCancel={handleCancel}
        onOk={handleCreateOrder}
      />
    </>
  );
};

export default Order;
