import { useParams } from "react-router-dom";
import { GetCustomerById, GetCustomers } from "../../api/customerApi";
import { useEffect, useState } from "react";
import { Card, Descriptions, Image, Table, Tag, type TableProps } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

type ListOrder = {
  name: string;
  price: number;
  image: string;
  status: string;
  order_code: number | string;
};

const statusDetailProductCustomer = [
  {
    status: "success",
    icon: <CheckCircleOutlined />,
    title: "Đã giao",
    color: "green",
  },
  {
    status: "error",
    icon: <CloseCircleOutlined />,
    title: "Đã hủy",
    color: "red",
  },
];

const DetailCustomer = () => {
  const { id } = useParams();
  const [data, setData] = useState({});
  console.log({ data });

  const fetchDataDetail = async () => {
    try {
      const dataDetail = await GetCustomerById(Number(id));
      const dataUser = await GetCustomers();

      const dataByIdUser = dataUser.find((item) => item.id === id);

      setData({ ...dataByIdUser, ...dataDetail });
    } catch (err) {
      console.log(err);
    }
  };

  const orderData = data.list_order;

  useEffect(() => {
    fetchDataDetail();
  }, []);

  if (!data) return;

  const columns: TableProps<ListOrder>["columns"] = [
    {
      title: "Mã đơn",
      dataIndex: "order_code",
      key: "order_code",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      fixed: "start",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      fixed: "start",
    },
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      render: (image: string) => <Image width={50} alt="image" src={image} />,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const item = statusDetailProductCustomer.find(
          (item) => item.status === status,
        );
        if (!item) return <Tag>{status}</Tag>;

        return (
          <Tag key={item.status} icon={item.icon} color={item.color}>
            {item.title}
          </Tag>
        );
      },
    },
  ];

  return (
    <Card title="Chi tiết khách hàng">
      <Descriptions column={2} bordered>
        <Descriptions.Item label="Tên">{data.fullname}</Descriptions.Item>

        <Descriptions.Item label="Email">{data.email}</Descriptions.Item>
      </Descriptions>

      <Card
        title="Danh sách đơn hàng"
        style={{
          marginTop: 24,
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orderData}
          pagination={false}
        />
      </Card>
    </Card>
  );
};

export default DetailCustomer;
