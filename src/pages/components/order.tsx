import { Flex, Input, Select, Space, Table, Tag, type TableProps } from "antd";
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

console.log("STATUS_OPTIONS", STATUS_OPTIONS);

const Order: React.FC = () => {
  const { Search } = Input;
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const keyword = searchText.trim().toLocaleLowerCase();
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
      fixed: "start",
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      fixed: "start",
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
      fixed: "end",
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
      fixed: "end",
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
      <Flex gap="medium" vertical>
        <Flex align="center" gap="medium" justify="space-between">
          <Flex align="center" gap="small" wrap>
            <Search
              allowClear={true}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Tìm kiếm đơn hàng"
              style={{ width: 260 }}
            />
            <Select
              allowClear
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 180 }}
            />
          </Flex>
        </Flex>
        <div style={{ border: "1px solid #f3f5f7" }}>
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
