import React, { useState } from "react";
import { Button, Flex, Image, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { products } from "../../mock-data/product";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { DataType } from "../../types/domain";
import { ModalProduct } from "../modal";

type ProductInitialValues = {
  prod_name?: string;
  sku?: string;
  category?: string;
  price?: number | string;
  stock?: number | string;
  description?: string;
  images?: string[];
};

const statusProduct = [
  { status: "active", icon: <CheckCircleOutlined />, title: "Đang bán" },
  { status: "pending", icon: <CloseCircleOutlined />, title: "Chưa bán" },
];

const columns: TableProps<DataType>["columns"] = [
  {
    title: "Image",
    dataIndex: "image",
    key: "image",
    render: (image: string) => <Image width={50} alt="image" src={image} />,
  },
  {
    title: "SKU",
    dataIndex: "sku",
    key: "sku",
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
  },
  {
    title: "Stock",
    dataIndex: "stock",
    key: "stock",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const item = statusProduct.find((item) => item.status === status);
      if (!item) return <Tag>{status}</Tag>;

      return (
        <Tag key={item.status} icon={item.icon} color={status}>
          {item.title}
        </Tag>
      );
    },
  },
  {
    title: "Action",
    key: "action",
    render: () => (
      <Space size="medium">
        <EditOutlined />
        <DeleteOutlined />
      </Space>
    ),
  },
];

const Product: React.FC = () => {
  const [data, setData] = useState<ProductInitialValues | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const handleAdd = () => {
    setIsOpenModal(true);
    setData(null);
  };

  const handleCancel = () => {
    setIsOpenModal(false);
    setData(null);
  };

  const handleOk = () => {
    console.log("Submit add product");
    setIsOpenModal(false);
    setData(null);
  };

  return (
    <>
      <Flex gap="medium" vertical>
        <Flex align="center" gap="medium" justify="end">
          <Button type="primary" onClick={handleAdd}>
            Add
          </Button>
        </Flex>
        <Table<DataType>
          columns={columns}
          dataSource={products}
          scroll={{ x: "max-content" }}
        />
      </Flex>

      <ModalProduct
        initialValue={data}
        open={isOpenModal}
        onOk={handleOk}
        onCancel={handleCancel}
      />
    </>
  );
};

export default Product;
