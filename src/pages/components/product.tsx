import React, { useState } from "react";
import { Button, Flex, Image, Input, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { DataType, ProductInitialValues } from "../../types/domain";
import { ModalProduct } from "../modal";
import openNotification from "../../@crema/core/Notification";
import formatCurrency from "../../utils/formatCurrecy";
import {
  CreateProduct,
  DeleteProduct,
  GetProduct,
  UpdateProduct,
} from "../../api/productApi";

const statusProduct = [
  {
    status: "active",
    icon: <CheckCircleOutlined />,
    title: "Đang bán",
    color: "green",
  },
  {
    status: "pending",
    icon: <CloseCircleOutlined />,
    title: "Chưa bán",
    color: "yellow",
  },
];

const Product: React.FC = () => {
  const { Search } = Input;
  const [rowData, setRowData] = useState<ProductInitialValues | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const { product, isLoading, refetch } = GetProduct();

  const handleAdd = () => {
    setIsOpenModal(true);
    setIsUpdate(false);
    setRowData(null);
  };

  const handleCancel = () => {
    setIsOpenModal(false);
    setIsUpdate(false);
    setRowData(null);
  };

  const handleDelete = async (id: number | string) => {
    await DeleteProduct(id);
    await refetch();

    openNotification("success", {
      message: "Thành công",
      description: "Xóa thành công sản phẩm",
    });
  };

  const handleUpdate = (values: DataType) => {
    setRowData({
      id: values.id,
      name: values.name,
      sku: values.sku,
      category: values.category,
      price: values.price,
      stock: values.stock,
      status: "pending",
      image: Array.isArray(values.image)
        ? values.image
        : values.image
          ? [String(values.image)]
          : [],
      description: values.description || "",
    });
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 50,
      fixed: "start",
      render: (image: string) => <Image width={50} alt="image" src={image} />,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 100,
      fixed: "start",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "start",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 50,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price) => formatCurrency(price),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 50,
      render: (status: string) => {
        const item = statusProduct.find((item) => item.status === status);
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
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  handleUpdate(record);
                  setIsUpdate(true);
                  setIsOpenModal(true);
                }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  if (record.id) {
                    handleDelete(record.id);
                  }
                }}
              />
            </Space>
          </>
        );
      },
    },
  ];

  const handleOk = async (values: ProductInitialValues) => {
    if (isUpdate) {
      if (!rowData?.id) {
        return;
      }

      const { ...updateValues } = values;

      delete updateValues.id;
      delete updateValues.stock;

      await UpdateProduct({ ...updateValues, id: rowData.id });
      await refetch();
      setIsOpenModal(false);
      setIsUpdate(false);
      setRowData(null);

      openNotification("success", {
        message: "Thành công",
        description: "Chỉnh sửa sản phẩm thành công",
      });
    } else {
      await CreateProduct(values);
      await refetch();
      setIsOpenModal(false);
      openNotification("success", {
        message: "Thành công",
        description: "Thêm mới sản phẩm thành công",
      });
    }
  };

  const handleSearch = (value: string | number | null) => {
    console.log(value);
  };

  return (
    <>
      <Flex gap="medium" vertical>
        <Flex align="center" gap="medium" justify="space-between">
          <Search
            allowClear={true}
            placeholder="Tìm kiếm sản phẩm"
            onSearch={(value) => handleSearch(value)}
            style={{ width: "20%" }}
          />
          <Button type="primary" onClick={handleAdd}>
            Add
          </Button>
        </Flex>
        <div style={{ border: "1px solid #f3f5f7" }}>
          <Table<DataType>
            rowKey="sku"
            columns={columns}
            dataSource={product}
            loading={isLoading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Flex>

      <ModalProduct
        initialValue={rowData}
        open={isOpenModal}
        onOk={handleOk}
        onCancel={handleCancel}
        isUpdate={isUpdate}
      />
    </>
  );
};

export default Product;
