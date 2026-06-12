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
import type { OrderType } from "../../types/domain";
import { useEffect, useState } from "react";
import { GetOrders } from "../../api/orderApi";
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
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const keyword = useDebounce(searchText.trim().toLocaleLowerCase());
  const filterDataOrder = data.filter((item) => {
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    const matchesSearch =
      !keyword ||
      item.order_code?.toLowerCase().includes(keyword) ||
      item.customer_name?.toLowerCase().includes(keyword);
    return matchesStatus && matchesSearch;
  });

  const handleSearch = (value: string | number | null) => {
    setSearchText(value ? String(value) : "");
  };

  const fetchDataOrder = async () => {
    try {
      const dataOrder = await GetOrders();
      setData(dataOrder);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDataOrder();
  }, []);

  const columns: TableProps<OrderType>["columns"] = [
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
                  if (!record.order_code) return;

                  navigate(`/${config.routes.DETAIL_ORDER(record.id)}`);
                }}
              />
            </Space>
          </>
        );
      },
    },
  ];
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
    </>
  );
};

export default Order;
