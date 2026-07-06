import { Flex, Grid, Input, Space, Table, type TableProps } from "antd";
import type React from "react";
import type {
  CreateCustomerValues,
  CustomerType,
  OrderType,
} from "../../types/domain";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import {
  CreateCustomer,
  DeleteCustomer,
  GetCustomers,
} from "../../api/customerApi";
import { GetOrders } from "../../api/orderApi";
import { useEffect, useState } from "react";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from "../../config";
import formatCurrency from "../../utils/formatCurrecy";
import useDebounce from "../../@crema/core/hook/useDebounce";
import { UserPermission } from "../../api/userPermission";
import { ModalCustomer } from "../modal";
import openNotification from "../../@crema/core/Notification";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { useTranslation } from "react-i18next";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 5;

const Customer: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { Search } = Input;
  const { isAdmin } = UserPermission();
  const { userInfo } = useAuth();
  const [rowData, setRowData] = useState<CustomerType | null>(null);
  const [dataCustomer, setDataCustomer] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const [totalItems, setTotalItems] = useState(0);
  const searchQuery = searchParams.get("q") ?? "";

  // State quản lý giá trị đang gõ vào ô tìm kiếm (debounce 500ms)
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Khi URL thay đổi từ bên ngoài, đồng bộ lại input
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Khi debounce thay đổi, cập nhật URL params
  useEffect(() => {
    if (debouncedSearch.trim() !== searchQuery.trim()) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const keyword = debouncedSearch.trim();
        if (keyword) {
          next.set("q", keyword);
          next.set("_page", String(DEFAULT_PAGE));
        } else {
          next.delete("q");
          next.delete("_page");
        }
        return next;
      });
    }
  }, [debouncedSearch, searchQuery, setSearchParams]);

  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const [customers, orders] = await Promise.all([
        GetCustomers(currentPage, pageSize, searchQuery),
        GetOrders(),
      ]);
      const orderList: OrderType[] = orders.data ?? [];
      const data = (customers.data ?? []).map((customer: CustomerType) => {
        const customerOrders = orderList.filter(
          (order) => String(order.customer_id) === String(customer.id),
        );
        const totalExpend = customerOrders.reduce((total, order) => {
          return total + Number(order.total_price ?? 0);
        }, 0);

        return {
          ...customer,
          total_orders: customerOrders.length,
          total_expend: totalExpend,
        };
      });

      setDataCustomer(data);
      setTotalItems(customers.items);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchQuery]);

  const handleAdd = () => {
    setIsOpenModal(true);
  };

  const handleCancel = () => {
    setIsOpenModal(false);
  };

  const getCreateErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      return t("customer.notification.emailExists");
    }

    if (err instanceof Error && err.message === "PHONE_EXISTS") {
      return t("customer.notification.phoneExists");
    }

    return t("customer.notification.createFailed");
  };

  const handleCreateCustomer = async (values: CreateCustomerValues) => {
    try {
      setIsCreating(true);
      await CreateCustomer(values);
      await CreateActiveLog({
        module: "Customer",
        action: "CREATE",
        user: userInfo?.name,
      });

      await fetchCustomer();
      setIsOpenModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("customer.notification.createSuccess"),
      });
    } catch (err) {
      console.log(err);
      openNotification("error", {
        message: t("common.failed"),
        description: getCreateErrorMessage(err),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (Number(rowData?.total_orders ?? 0) > 0) {
        openNotification("error", {
          message: t("common.failed"),
          description: t("customer.notification.deleteHasOrders"),
        });
        return;
      }
      if (!rowData?.id) return;

      await Promise.all([
        DeleteCustomer(rowData.id),
        CreateActiveLog({
          module: "Customer",
          action: "DELETE",
          user: userInfo?.name,
        }),
      ]);
      await fetchCustomer();
      setIsDeleteModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("customer.notification.deleteSuccess"),
      });
    } catch (err) {
      console.log(err);
      openNotification("error", {
        message: t("common.failed"),
        description: t("customer.notification.deleteFailed"),
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModal(false);
  };

  const columns: TableProps<CustomerType>["columns"] = [
    {
      title: t("customer.columns.no"),
      fixed: !isMobile ? "start" : false,
      width: 20,
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t("customer.columns.fullname"),
      dataIndex: "fullname",
      key: "fullname",
      fixed: !isMobile ? "start" : false,
      width: 100,
    },
    {
      title: t("customer.columns.email"),
      dataIndex: "email",
      key: "email",
      width: 80,
    },
    {
      title: t("customer.columns.address"),
      dataIndex: "address",
      key: "address",
      width: 100,
    },
    {
      title: t("customer.columns.phone"),
      dataIndex: "phone",
      key: "phone",
      width: 80,
    },
    {
      title: t("customer.columns.totalOrders"),
      dataIndex: "total_orders",
      key: "total_orders",
      align: "center",
      width: 100,
    },
    {
      title: t("customer.columns.totalExpend"),
      dataIndex: "total_expend",
      key: "total_expend",
      align: "center",
      width: 100,
      render: (totalExpend) => formatCurrency(Number(totalExpend ?? 0)),
    },
    {
      title: t("customer.columns.action"),
      key: "action",
      fixed: !isMobile ? "end" : false,
      width: 100,
      align: "center",
      render: (_, record) => {
        return (
          <>
            <Space size="medium">
              <AntButton
                tooltip={t("customer.tooltip.viewDetail")}
                icon={<EyeOutlined />}
                onClick={() => {
                  if (!record.id) return;

                  navigate(`/${config.routes.DETAIL_CUSTOMER(record.id)}`);
                }}
              />
              <AntButton
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

  return (
    <Flex className="page-stack" gap="medium" vertical>
      <div className="page-toolbar">
        <Search
          allowClear={true}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("customer.placeholder.search")}
          className="page-search"
        />
        {isAdmin && (
          <AntButton
            tooltip={t("common.add")}
            type="primary"
            onClick={handleAdd}
          >
            {t("common.add")}
          </AntButton>
        )}
      </div>
      <div className="table-shell">
        <Table<CustomerType>
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={dataCustomer}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            showTotal: (total, range) =>
              t("customer.pagination", { count: range[1] - range[0] + 1, total }),
            onChange: (page, size) => {
              setSearchParams({
                _page: String(page),
                _per_page: String(size),
              });
            },
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
      <ModalCustomer
        open={isOpenModal}
        loading={isCreating}
        onCancel={handleCancel}
        onOk={handleCreateCustomer}
      />

      <ModalConfirm
        open={isDeleteModal}
        onOk={handleDelete}
        onCancel={handleCancelDelete}
        targetName={rowData?.fullname}
      />
    </Flex>
  );
};

export default Customer;
