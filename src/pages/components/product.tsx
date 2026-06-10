import React, { useMemo, useState } from "react";
import { Flex, Image, Input, Select, Space, Table, Tag } from "antd";
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
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import formatDate from "../../utils/formatDate";

const STATUS_MAP: Record<
  string,
  { icon: React.ReactNode; title: string; color: string }
> = {
  active: { icon: <CheckCircleOutlined />, title: "Đang bán", color: "green" },
  pending: {
    icon: <CloseCircleOutlined />,
    title: "Chưa bán",
    color: "yellow",
  },
};

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, { title }]) => ({
  label: title,
  value,
}));

const RANGE_PRICE = [
  { label: "Dưới 100", value: "100" },
  { label: "Dưới 1000", value: "1000" },
  { label: "Dưới 1500", value: "1500" },
  { label: "Dưới 2000", value: "2000" },
  { label: "Dưới 2500", value: "2500" },
  { label: "Trên 3000", value: "above-3000" },
];

const Product: React.FC = () => {
  const { Search } = Input;
  const { userInfo } = useAuth();
  const [rowData, setRowData] = useState<ProductInitialValues | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedPrice, setSelectedPrice] = useState<string>();
  const { product, isLoading, refetch } = GetProduct();
  const { category } = GetCategory();

  const categoryMap = useMemo(
    () => new Map(category.map((item) => [String(item.id), item.name])),
    [category],
  );

  const filteredProduct = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return product.filter((item) => {
      const categoryId =
        typeof item.category === "object" ? item.category?.id : item.category;
      const categoryName = categoryMap.get(String(categoryId)) ?? "";

      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.sku?.toLowerCase().includes(keyword) ||
        categoryName.toLowerCase().includes(keyword);

      const matchesCategory =
        !selectedCategory || String(categoryId) === selectedCategory;
      const matchesStatus = !selectedStatus || item.status === selectedStatus;
      const matchesPrice =
        !selectedPrice ||
        (selectedPrice === "above-3000"
          ? item.price > 3000
          : item.price <= Number(selectedPrice));

      return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
    });
  }, [
    categoryMap,
    product,
    searchText,
    selectedCategory,
    selectedStatus,
    selectedPrice,
  ]);

  const categoryOptions = useMemo(
    () =>
      Array.from(categoryMap.entries()).map(([value, label]) => ({
        label,
        value,
      })),
    [categoryMap],
  );

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

    await Promise.all([
      DeleteProduct(rowData.id),
      CreateActiveLog({
        module: "Product",
        action: "DELETE",
        user: userInfo?.name,
      }),
    ]);

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
      render: (categoryId: string) =>
        categoryMap.get(String(categoryId)) ?? categoryId,
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
        const item = STATUS_MAP[status];
        if (!item) return <Tag>{status}</Tag>;
        return (
          <Tag icon={item.icon} color={item.color}>
            {item.title}
          </Tag>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      render: () => {
        return formatDate(Date.now() * Math.random());
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

      await Promise.all([
        UpdateProduct({ ...updateValues, id: rowData.id }),
        CreateActiveLog({
          module: "Product",
          action: "UPDATE",
          user: userInfo?.name,
        }),
      ]);

      await refetch();
      setIsOpenModal(false);
      setIsUpdate(false);
      setRowData(null);

      openNotification("success", {
        message: "Thành công",
        description: "Chỉnh sửa sản phẩm thành công",
      });
    } else {
      await Promise.all([
        CreateProduct(values),
        CreateActiveLog({
          module: "Product",
          action: "CREATE",
          user: userInfo?.name,
        }),
      ]);

      await refetch();
      setIsOpenModal(false);
      openNotification("success", {
        message: "Thành công",
        description: "Thêm mới sản phẩm thành công",
      });
    }
  };

  const handleSearch = (value: string | number | null) => {
    setSearchText(value ? String(value) : "");
  };

  return (
    <>
      <Flex gap="medium" vertical>
        <Flex align="center" gap="medium" justify="space-between" wrap>
          <Flex align="center" gap="small" wrap>
            <Search
              allowClear={true}
              placeholder="Tìm kiếm sản phẩm"
              onChange={(event) => handleSearch(event.target.value)}
              style={{ width: 260 }}
            />
            <Select
              allowClear
              placeholder="Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 180 }}
            />
            <Select
              allowClear
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
            />
            <Select
              allowClear
              placeholder="Price"
              options={RANGE_PRICE}
              value={selectedPrice}
              onChange={setSelectedPrice}
              style={{ width: 150 }}
            />
          </Flex>
          <AntButton tooltip="Thêm mới" type="primary" onClick={handleAdd}>
            Add
          </AntButton>
        </Flex>
        <div style={{ border: "1px solid #f3f5f7" }}>
          <Table<DataType>
            rowKey="sku"
            columns={columns}
            dataSource={filteredProduct}
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
