import {
  Flex,
  Grid,
  Input,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from "antd";
import type React from "react";
import type {
  CreateOrderValues,
  CustomerType,
  DataType,
  OrderType,
} from "../../types/domain";
import { useEffect, useState } from "react";
import { CreateOrder, GetOrders } from "../../api/orderApi";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import formatCurrency from "../../utils/formatCurrecy";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import useDebounce from "../../@crema/core/hook/useDebounce";
import { UserPermission } from "../../api/userPermission";
import { ModalCart } from "../modal";
import { GetCustomers } from "../../api/customerApi";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import openNotification from "../../@crema/core/Notification";
import callApiWithRetries from "../../api/callApiWithRetries";
import formatDate from "../../utils/formatDate";
import exportToCSV from "../../@crema/core/ExportToCSV";

const statusOrder = [
  {
    status: "completed",
    icon: <CheckCircleOutlined />,
    title: "Thành công",
    color: "green",
  },
  {
    status: "processing",
    icon: <ClockCircleOutlined />,
    title: "Đang xử lý",
    color: "yellow",
  },
  {
    status: "cancelled",
    icon: <CloseCircleOutlined />,
    title: "Đã hủy",
    color: "red",
  },
  {
    status: "pending",
    icon: <CloseCircleOutlined />,
    title: "Chờ xử lý",
    color: "gray",
  },
  {
    status: "shipping",
    icon: <ClockCircleOutlined />,
    title: "Đang giao",
    color: "blue",
  },
];

const STATUS_OPTIONS = Object.entries(statusOrder).map(
  ([_, { title, status }]) => ({
    label: title,
    value: status,
  }),
);

const Order: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { Search } = Input;
  const { isAdmin } = UserPermission();
  const { userInfo } = useAuth();
  const [data, setData] = useState<OrderType[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [products, setProducts] = useState<DataType[]>([]);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [isModalAdd, setIsModalAdd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const keyword = useDebounce(searchText.trim().toLocaleLowerCase());
  const filterDataOrder = data.filter((item) => {
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    const matchesSearch =
      !keyword ||
      String(item.order_code ?? "")
        .toLowerCase()
        .includes(keyword) ||
      item.customer_name?.toLowerCase().includes(keyword);
    return matchesStatus && matchesSearch;
  });

  const handleSearch = (value: string | number | null) => {
    setSearchText(value ? String(value) : "");
  };

  const fetchDataOrder = async () => {
    try {
      const dataOrder = await GetOrders();
      setData([...dataOrder].reverse());
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const dataCustomer = (await GetCustomers()) ?? [];
      setCustomers([...dataCustomer].reverse());
    } catch (err) {
      console.log(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const dataProduct: DataType[] =
        (await callApiWithRetries({
          url: "/products",
        })) ?? [];
      const productCurrent = dataProduct.filter(
        (product) => product.status === "active",
      );
      setProducts([...productCurrent].reverse());
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOrderOptions = async () => {
    setIsLoadingOptions(true);
    try {
      await Promise.all([fetchCustomers(), fetchProducts()]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchDataOrder();
  }, []);

  const columns: TableProps<OrderType>["columns"] = [
    {
      title: "STT",
      fixed: !isMobile ? "start" : false,
      width: 20,
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "Mã đơn",
      dataIndex: "order_code",
      key: "order_code",
      fixed: !isMobile ? "start" : false,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      fixed: !isMobile ? "start" : false,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) => formatDate(created_at),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (_, record) => formatCurrency(Number(record.total_price)),
    },
    {
      title: "Trạng thái",
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

    return "Không thể thêm mới đơn hàng";
  };

  const handleCreateOrder = async (values: CreateOrderValues) => {
    try {
      setIsCreating(true);
      await Promise.all([
        CreateOrder(values, customers, products),
        CreateActiveLog({
          module: "Order",
          action: "CREATE",
          user: userInfo?.name,
        }),
      ]);

      await Promise.all([fetchDataOrder(), fetchOrderOptions()]);
      setIsModalAdd(false);
      openNotification("success", {
        message: "Thành công",
        description: "Thêm mới đơn hàng thành công",
      });
    } catch (err) {
      console.log(err);
      openNotification("error", {
        message: "Thất bại",
        description: getCreateOrderErrorMessage(err),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Chờ xác nhận",
      cancel: "Đã hủy",
      processing: "Đang xử lý",
      shipping: "Đang giao hàng",
      completed: "Hoàn thành",
    };
    return statusMap[status];
  };

  const exportData = data.map((d, index) => ({
    "Số thứ tự": index + 1,
    "Mã đơn hàng": d.order_code,
    "Tên khách hàng": d.customer_name,
    "Email": d.customer_email,
    "Địa chỉ": d.shipping_address,
    "Ngày tạo": d.created_at ? formatDate(d.created_at) : "",
    "Tổng tiền": formatCurrency(d.total_price),
    "Trạng thái": d.status ? formatStatus(d.status) : "",
  }));

  const exportExcel = () => {
    return exportToCSV(exportData, "order.csv");
  };

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <div className="page-toolbar-controls">
            <Search
              allowClear={true}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Tìm kiếm đơn hàng"
              className="page-search"
            />
            <Select
              allowClear
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="page-control"
            />
          </div>
          <Flex gap={10}>
            <AntButton tooltip="Xuất Excel" onClick={exportExcel}>
              Export
            </AntButton>
            {isAdmin && (
              <AntButton tooltip="Thêm mới" type="primary" onClick={handleAdd}>
                Add
              </AntButton>
            )}
          </Flex>
        </div>
        <div className="table-shell">
          <Table<OrderType>
            rowKey="order_code"
            columns={columns}
            dataSource={filterDataOrder}
            pagination={{ pageSize: 5 }}
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
