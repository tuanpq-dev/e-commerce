import React, { useMemo, useState } from "react";
import { Flex, Grid, Image, Input, Select, Space, Table, Tag } from "antd";
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
import { UserPermission } from "../../api/userPermission";
import useDebounce from "../../@crema/core/hook/useDebounce";

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

const getProductVariants = (record: DataType) => record.variants ?? [];

const getProductPrice = (record: DataType) => {
  const variants = getProductVariants(record);

  if (!variants.length) {
    return Number(record.price);
  }

  return Math.min(...variants.map((variant) => Number(variant.price)));
};

const getProductStock = (record: DataType) => {
  const variants = getProductVariants(record);

  if (!variants.length) {
    return Number(record.stock);
  }

  return variants.reduce((total, variant) => total + Number(variant.stock), 0);
};

const formatProductPrice = (record: DataType) => {
  const variants = getProductVariants(record);

  if (!variants.length) {
    return formatCurrency(record.price);
  }

  const prices = variants.map((variant) => Number(variant.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatCurrency(minPrice);
  }

  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
};

const formatProductVariants = (record: DataType) => {
  const variants = getProductVariants(record);

  if (!variants.length) {
    return "Default";
  }

  if (variants.length > 3) {
    return `${variants.length} variants`;
  }

  return variants
    .map((variant) => `${variant.size}/${variant.color}`)
    .join(", ");
};

const getCategoryChildIds = (categoryChild: DataType["category_child"]) =>
  (categoryChild ?? [])
    .map((item) => {
      if (typeof item === "object") {
        return item.id;
      }

      return item;
    })
    .filter((item): item is string | number => item !== undefined);

const Product: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
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
  const { isAdmin } = UserPermission();

  const categoryMap = useMemo(
    () => new Map(category.map((item) => [String(item.id), item.name])),
    [category],
  );

  const keyword = useDebounce(searchText.trim().toLowerCase());
  const filteredProduct = useMemo(() => {
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
          ? getProductPrice(item) > 3000
          : getProductPrice(item) <= Number(selectedPrice));

      return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
    });
  }, [
    categoryMap,
    product,
    keyword,
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
      category_child: getCategoryChildIds(values.category_child),
      price: values.price,
      stock: values.stock,
      variants: values.variants,
      status: "pending",
      description: values.description || "",
    });
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 50,
      fixed: !isMobile ? "start" : false,
      render: () => <Image width={50} alt="image" />,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 100,
      fixed: !isMobile ? "start" : false,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: !isMobile ? "start" : false,
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
      render: (_, record) => formatProductPrice(record),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (_, record) => getProductStock(record),
    },
    {
      title: "Variants",
      dataIndex: "variants",
      key: "variants",
      width: 160,
      render: (_, record) => formatProductVariants(record),
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
      render: (_, record) => {
        return record.created_at ? formatDate(record.created_at) : "";
      },
    },
    {
      title: "Action",
      key: "action",
      fixed: !isMobile ? "end" : false,
      width: 100,
      hidden: !isAdmin,
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
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <div className="page-toolbar-controls">
            <Search
              allowClear={true}
              placeholder="Tìm kiếm sản phẩm"
              onChange={(event) => handleSearch(event.target.value)}
              className="page-search"
            />
            <Select
              allowClear
              placeholder="Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="page-control"
            />
            <Select
              allowClear
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="page-control"
            />
            <Select
              allowClear
              placeholder="Price"
              options={RANGE_PRICE}
              value={selectedPrice}
              onChange={setSelectedPrice}
              className="page-control"
            />
          </div>
          {isAdmin && (
            <AntButton tooltip="Thêm mới" type="primary" onClick={handleAdd}>
              Add
            </AntButton>
          )}
        </div>
        <div className="table-shell">
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
