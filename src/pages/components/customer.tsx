import { Flex, Grid, Input, Space, Table, type TableProps } from "antd";
import type React from "react";
import type {
  CreateCustomerValues,
  CustomerType,
  OrderType,
} from "../../types/domain";
import { EyeOutlined } from "@ant-design/icons";
import { CreateCustomer, GetCustomers } from "../../api/customerApi";
import { GetOrders } from "../../api/orderApi";
import { useEffect, useState } from "react";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import formatCurrency from "../../utils/formatCurrecy";
import useDebounce from "../../@crema/core/hook/useDebounce";
import { UserPermission } from "../../api/userPermission";
import { ModalCustomer } from "../modal";
import openNotification from "../../@crema/core/Notification";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";

const Customer: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { Search } = Input;
  const { isAdmin } = UserPermission();
  const { userInfo } = useAuth();
  const [dataCustomer, setDataCustomer] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const keyword = useDebounce(searchText.trim().toLocaleLowerCase());
  const filterDataOrder = dataCustomer.filter((item) => {
    return (
      !keyword ||
      item.fullname?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword)
    );
  });

  const handleSearch = (value: string | number | null) => {
    setSearchText(value ? String(value) : "");
  };

  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const [customers, orders] = await Promise.all([
        GetCustomers(),
        GetOrders(),
      ]);
      const orderList: OrderType[] = orders ?? [];
      const data = (customers ?? []).map((customer: CustomerType) => {
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

      setDataCustomer(data.reverse());
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const handleAdd = () => {
    setIsOpenModal(true);
  };

  const handleCancel = () => {
    setIsOpenModal(false);
  };

  const getCreateErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      return "Email đã tồn tại";
    }

    if (err instanceof Error && err.message === "PHONE_EXISTS") {
      return "Số điện thoại đã tồn tại";
    }

    return "Không thể thêm mới khách hàng";
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
        message: "Thành công",
        description: "Thêm mới khách hàng thành công",
      });
    } catch (err) {
      console.log(err);
      openNotification("error", {
        message: "Thất bại",
        description: getCreateErrorMessage(err),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const columns: TableProps<CustomerType>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      fixed: !isMobile ? "start" : false,
      width: 50,
    },
    {
      title: "Họ tên",
      dataIndex: "fullname",
      key: "fullname",
      fixed: !isMobile ? "start" : false,
      width: 100,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 80,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 100,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 80,
    },
    {
      title: "Tổng số đơn",
      dataIndex: "total_orders",
      key: "total_orders",
      align: "center",
      width: 100,
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "total_expend",
      key: "total_expend",
      align: "center",
      width: 100,
      render: (totalExpend) => formatCurrency(Number(totalExpend ?? 0)),
    },
    {
      title: "Action",
      key: "action",
      fixed: !isMobile ? "end" : false,
      width: 100,
      align: "center",
      render: (_, record) => {
        return (
          <>
            <Space size="medium">
              <AntButton
                tooltip="Xem chi tiết"
                icon={<EyeOutlined />}
                onClick={() => {
                  if (!record.id) return;

                  navigate(`/${config.routes.DETAIL_CUSTOMER(record.id)}`);
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
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Tìm kiếm khách hàng"
          className="page-search"
        />
        {isAdmin && (
          <AntButton tooltip="Thêm mới" type="primary" onClick={handleAdd}>
            Add
          </AntButton>
        )}
      </div>
      <div className="table-shell">
        <Table<CustomerType>
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={filterDataOrder}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </div>
      <ModalCustomer
        open={isOpenModal}
        loading={isCreating}
        onCancel={handleCancel}
        onOk={handleCreateCustomer}
      />
    </Flex>
  );
};

export default Customer;
