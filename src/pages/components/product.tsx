import React, { useState } from "react";
import { Flex, Image, Input, Space, Table, Tag } from "antd";
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
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { GetCategory } from "../../api/categoryApi";
import AntButton from "../../@crema/component/AntButton";

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
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const { product, isLoading, refetch } = GetProduct();
  const { category } = GetCategory();

  const handleAdd = () => {
    setIsOpenModal(true);
    setIsUpdate(false);
    setRowData(null);
  };

  const handleCancel = () => {
    setIsOpenModal(false);
    setIsUpdate(false);
    setIsDeleteModal(false);
    setRowData(null);
  };

  const handleDelete = async () => {
    if (!rowData?.id) {
      return;
    }

    setIsDeleting(true);
    await DeleteProduct(rowData.id);
    await refetch();
    setIsDeleting(false);
    setIsDeleteModal(false);
    setRowData(null);

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
      width: 50,
      render: (categoryId: string) => {
        const found = category.find((o) => o.id === categoryId);
        return found?.name ?? categoryId;
      },
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
              <AntButton
                tooltip="Chỉnh sửa"
                icon={<EditOutlined />}
                onClick={() => {
                  handleUpdate(record);
                  setIsUpdate(true);
                  setIsOpenModal(true);
                }}
              />
              <AntButton
                danger
                tooltip="Xóa"
                icon={<DeleteOutlined />}
                onClick={() => {
                  setIsDeleteModal(true);
                  setRowData({ id: record.id, name: record.name });
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
          <AntButton tooltip="Thêm mới" type="primary" onClick={handleAdd}>
            Add
          </AntButton>
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
        options={category}
      />

      <ModalConfirm
        open={isDeleteModal}
        confirmLoading={isDeleting}
        disabled={!rowData?.id}
        targetName={rowData?.name}
        onOk={handleDelete}
        onCancel={handleCancel}
      />
    </>
  );
};

export default Product;
