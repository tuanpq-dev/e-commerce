import { Flex, Input, Space, Table, type TableProps } from "antd";
import type React from "react";
import type { CustomerType, OrderType } from "../../types/domain";
import { EyeOutlined } from "@ant-design/icons";
import { GetCustomers } from "../../api/customerApi";
import { GetOrders } from "../../api/orderApi";
import { useEffect, useState } from "react";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import formatCurrency from "../../utils/formatCurrecy";

const Customer: React.FC = () => {
  const { Search } = Input;
  const [dataCustomer, setDataCustomer] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

      setDataCustomer(data);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const columns: TableProps<CustomerType>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      fixed: "start",
      width: 50,
    },
    {
      title: "Họ tên",
      dataIndex: "fullname",
      key: "fullname",
      fixed: "start",
      width: 100,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 80,
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
    <Flex gap="medium" vertical>
      <Flex align="center" gap="medium" justify="space-between">
        <Search
          allowClear={true}
          placeholder="Tìm kiếm sản phẩm"
          style={{ width: "20%" }}
        />
      </Flex>
      <div style={{ border: "1px solid #f3f5f7" }}>
        <Table<CustomerType>
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={dataCustomer}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </Flex>
  );
};

export default Customer;
