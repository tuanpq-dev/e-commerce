import { Flex, Space, Table, type TableProps } from "antd";
import type React from "react";
import type { CustomerType } from "../../types/domain";
import { EyeOutlined } from "@ant-design/icons";
import { GetCustomers } from "../../api/customerApi";
import { useEffect, useState } from "react";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate } from "react-router-dom";
import config from "../../config";

const Customer: React.FC = () => {
  const [rowData, setRowData] = useState({});
  const [dataCustomer, setDataCustomer] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const data = await GetCustomers();
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
    },
    {
      title: "Họ tên",
      dataIndex: "fullname",
      key: "fullname",
      fixed: "start",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Tổng số đơn",
      dataIndex: "total_orders",
      key: "total_orders",
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "total_expend",
      key: "total_expend",
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
    <>
      <Flex gap="medium" vertical>
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
    </>
  );
};

export default Customer;
