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
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
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
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 5;

const Order: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { userInfo } = useAuth();
  const [data, setData] = useState<OrderType[]>([]);
  const [rowData, setRowData] = useState(null);
  const [products, setProducts] = useState<DataType[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const navigate = useNavigate();
  const [isModalAdd, setIsModalAdd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
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
      const list = Array.isArray(dataProduct) ? dataProduct : (dataProduct?.data || []);
      const productCurrent = list.filter(
        (product: any) => product.status?.toLowerCase() === "active",
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
      key: "customerName",
      fixed: !isMobile ? "start" : false,
      render: (_, record) => record.customer?.fullname ?? record.customerName ?? "-",
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
      render: (_, record) => {
        const total =
          record.totalPrice != null
            ? Number(record.totalPrice)
            : (record.items ?? []).reduce(
              (sum, item) =>
                sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
              0,
            );
        return formatCurrency(total);
      },
    },
    {
      title: t("order.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusLower = String(status ?? "").toLowerCase();
        const item = statusOrder.find((s) => s.status.toLowerCase() === statusLower);
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
              <AntButton
                danger
                tooltip={t("common.delete")}
                icon={<DeleteOutlined />}
                onClick={() => {
                  setIsDeleteModal(true);
                  setRowData(record);
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

    if (products.length === 0 || customers.length === 0) {
      await fetchOrderOptions();
    }
  };

  const handleCancel = () => {
    setIsModalAdd(false);
    setIsDeleteModal(false);
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

      setIsModalAdd(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("order.notification.createSuccess"),
      });
      await fetchDataOrder();
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
    const statusLower = String(status ?? "").toLowerCase();
    const found = statusOrder.find((s) => s.status.toLowerCase() === statusLower);
    return found?.title ?? status;
  };

  const exportData = data.map((d, index) => {
    const total =
      d.totalPrice != null
        ? Number(d.totalPrice)
        : (d.items ?? []).reduce(
          (sum, item) =>
            sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
          0,
        );
    return {
      [t("order.exportColumns.no")]: index + 1,
      [t("order.exportColumns.orderCode")]: d.orderCode,
      [t("order.exportColumns.customerName")]: d.customer?.fullname,
      [t("order.exportColumns.email")]: d.customer?.email,
      [t("order.exportColumns.address")]: d.shippingAddress,
      [t("order.exportColumns.createdAt")]: d.createdAt
        ? formatDate(d.createdAt)
        : "",
      [t("order.exportColumns.totalPrice")]: formatCurrency(total),
      [t("order.exportColumns.status")]: d.status ? formatStatus(d.status) : "",
    };
  });

  const exportExcel = () => {
    return exportToCSV(exportData, "order.csv");
  };

  const handleDeleteOrder = async () => {
    if (!rowData || !rowData.id) return;

    try {
      await axiosClient.delete(`/order/${rowData.id}`);
      await CreateActiveLog({
        module: "Order",
        action: "DELETE",
        userName: userInfo?.fullname || "",
        userRole: userInfo?.role,
        userId: Number(userInfo?.id),
        payload: { id: rowData.id, orderCode: rowData.orderCode },
      });

      setIsDeleteModal(false);

      openNotification("success", {
        message: t("common.success"),
        description: t("order.notification.deleteSuccess"),
      });

      await fetchDataOrder()
    } catch (error) {
      openNotification("error", {
        message: t("common.delete"),
        description: 'Xóa đơn hàng thất bại',
      });
      throw new Error('Xóa đơn hàng thất bại')
    }
  }

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

      <ModalConfirm
        open={isDeleteModal}
        targetName={rowData?.orderCode}
        onOk={handleDeleteOrder}
        onCancel={handleCancel}
      />
    </>
  );
};

export default Order;
