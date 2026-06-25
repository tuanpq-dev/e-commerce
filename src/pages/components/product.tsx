import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Flex, Grid, Image, Input, Select, Space, Table } from "antd";
import type { TableProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type {
  CategoryType,
  DataType,
  ProductInitialValues,
} from "../../types/domain";
import { ModalProduct } from "../modal";
import openNotification from "../../@crema/core/Notification";
import formatCurrency from "../../utils/formatCurrecy";
import {
  CreateProduct,
  DeleteProduct,
  GetProducts,
  UpdateProduct,
  UpdateStatusProduct,
} from "../../api/productApi";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { GetCategories } from "../../api/categoryApi";
import AntButton from "../../@crema/component/AntButton";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import formatDate from "../../utils/formatDate";
import { UserPermission } from "../../api/userPermission";
import useDebounce from "../../@crema/core/hook/useDebounce";
import { useTranslation } from "react-i18next";

const getProductVariants = (record: DataType) => record.variants ?? [];

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

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 5;

const Product: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
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
  const [product, setProduct] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<CategoryType[]>([]);
  const { isAdmin } = UserPermission();

  // ─── Pagination đồng bộ URL ───────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalItems, setTotalItems] = useState(0);

  // Bóc tách _page và _per_page từ URL, fallback về giá trị mặc định
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, items } = await GetProducts(currentPage, pageSize);
      setProduct(data);
      setTotalItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  // Gọi API khi page/pageSize (từ URL) thay đổi
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    GetCategories()
      .then((res) => setCategory(res.data))
      .catch(console.error);
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    category.forEach((item) => {
      if (item.id) {
        map.set(String(item.id), item.name || "");
      }
      if (item.child) {
        item.child.forEach((childItem) => {
          if (childItem.id) {
            map.set(String(childItem.id), childItem.name || "");
          }
        });
      }
    });
    return map;
  }, [category]);

  const keyword = useDebounce(searchText.trim().toLowerCase());
  const filteredProduct = useMemo(() => {
    return product.filter((item) => {
      const variants = item.variants ?? [];

      const prices = variants
        .map((variant) => Number(variant.price))
        .filter((price) => !Number.isNaN(price));

      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      const categoryId =
        typeof item.category === "object" ? item.category?.id : item.category;

      const parentName = categoryMap.get(String(categoryId)) ?? "";

      const childIds = (item.category_child ?? [])
        .map((child) => (typeof child === "object" ? child?.id : child))
        .filter((id): id is string | number => id !== undefined);

      const childNames = childIds
        .map((id) => categoryMap.get(String(id)))
        .filter(Boolean)
        .join(" ");

      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.sku?.toLowerCase().includes(keyword) ||
        parentName.toLowerCase().includes(keyword) ||
        childNames.toLowerCase().includes(keyword);

      const matchesCategory =
        !selectedCategory ||
        String(categoryId) === selectedCategory ||
        childIds.some((id) => String(id) === selectedCategory);

      const matchesStatus = !selectedStatus || item.status === selectedStatus;

      const matchesPrice =
        !selectedPrice ||
        (selectedPrice === "above-3000"
          ? maxPrice > 3000
          : minPrice < Number(selectedPrice));

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

  const statusOptions = useMemo(
    () => [
      { label: t("product.status.active"), value: "active" },
      { label: t("product.status.pending"), value: "pending" },
    ],
    [t],
  );

  const rangePriceOptions = useMemo(
    () => [
      { label: t("product.priceRange.under100"), value: "100" },
      { label: t("product.priceRange.under1000"), value: "1000" },
      { label: t("product.priceRange.under1500"), value: "1500" },
      { label: t("product.priceRange.under2000"), value: "2000" },
      { label: t("product.priceRange.under2500"), value: "2500" },
      { label: t("product.priceRange.above3000"), value: "above-3000" },
    ],
    [t],
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

    await fetchProducts();
    setIsDeleting(false);
    setIsDeleteModal(false);
    setRowData(null);

    openNotification("success", {
      message: t("common.success"),
      description: t("product.notification.deleteSuccess"),
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
      basePrice: values.basePrice,
      selectedSizes: values.selectedSizes,
      selectedColors: values.selectedColors,
      variants: values.variants,
      description: values.description || "",
    });
  };

  const handleChangeStatus = async (status: string, id: number | string) => {
    try {
      await Promise.all([
        UpdateStatusProduct(status, id),
        CreateActiveLog({
          module: "Product",
          action: `UPDATE status - ${id}`,
          user: userInfo?.name,
        }),
      ]);
      await fetchProducts();
      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.updateStatus"),
      });
    } catch (err) {
      openNotification("error", {
        message: t("common.failed"),
        description: t("product.notification.updateStatus"),
      });
      return err;
    }
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: t("category.columns.no"),
      fixed: !isMobile ? "start" : false,
      width: 20,
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t("product.columns.image"),
      dataIndex: "image",
      key: "image",
      width: 50,
      fixed: !isMobile ? "start" : false,
      render: () => <Image width={50} alt="image" />,
    },
    {
      title: t("product.columns.sku"),
      dataIndex: "sku",
      key: "sku",
      width: 100,
      fixed: !isMobile ? "start" : false,
    },
    {
      title: t("product.columns.name"),
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: !isMobile ? "start" : false,
    },
    {
      title: t("product.columns.category"),
      dataIndex: "category",
      width: 150,
      render: (categoryVal: string | CategoryType, record: DataType) => {
        const parentId =
          typeof categoryVal === "object" ? categoryVal?.id : categoryVal;
        const parentName =
          categoryMap.get(String(parentId)) ?? String(parentId ?? "");

        const childIds = (record.category_child ?? [])
          .map((child) => (typeof child === "object" ? child?.id : child))
          .filter((id): id is string | number => id !== undefined);

        const childNames = childIds
          .map((id) => categoryMap.get(String(id)))
          .filter(Boolean)
          .join(", ");

        return childNames ? `${parentName} > ${childNames}` : parentName;
      },
    },
    {
      title: t("product.columns.price"),
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (_, record) => formatProductPrice(record),
    },
    {
      title: t("product.columns.stock"),
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (_, record) => getProductStock(record),
    },
    {
      title: t("product.columns.variants"),
      dataIndex: "variants",
      key: "variants",
      width: 160,
      render: (_, record) => formatProductVariants(record),
    },
    {
      title: t("product.columns.status"),
      dataIndex: "status",
      key: "status",
      width: 50,
      render: (status: string, record) => (
        <Select
          size="small"
          value={status}
          options={statusOptions}
          style={{ width: 120 }}
          onChange={(status) =>
            record.id && handleChangeStatus(status, record.id)
          }
        />
      ),
    },
    {
      title: t("product.columns.createdAt"),
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      render: (_, record) => {
        return record.created_at ? formatDate(record.created_at) : "";
      },
    },
    {
      title: t("product.columns.action"),
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
                tooltip={t("common.update")}
                icon={<EditOutlined />}
                onClick={() => {
                  handleUpdate(record);
                  setIsUpdate(true);
                  setIsOpenModal(true);
                }}
              />
              <AntButton
                danger
                tooltip={t("common.delete")}
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

      await Promise.all([
        UpdateProduct({ ...values, id: rowData.id }),
        CreateActiveLog({
          module: "Product",
          action: "UPDATE",
          user: userInfo?.name,
        }),
      ]);

      await fetchProducts();
      setIsOpenModal(false);
      setIsUpdate(false);
      setRowData(null);

      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.updateSuccess"),
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

      await fetchProducts();
      setIsOpenModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.createSuccess"),
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
              placeholder={t("product.placeholder.search")}
              onChange={(event) => handleSearch(event.target.value)}
              className="page-search"
            />
            <Select
              allowClear
              placeholder={t("product.placeholder.category")}
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="page-control"
            />
            <Select
              allowClear
              placeholder={t("product.placeholder.status")}
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="page-control"
            />
            <Select
              allowClear
              placeholder={t("product.placeholder.price")}
              options={rangePriceOptions}
              value={selectedPrice}
              onChange={setSelectedPrice}
              className="page-control"
            />
          </div>
          {isAdmin && (
            <AntButton
              tooltip={t("common.add")}
              type="primary"
              onClick={handleAdd}
            >
              {t("common.add")}
            </AntButton>
          )}
        </div>
        <div className="table-shell">
          <Table<DataType>
            rowKey="sku"
            columns={columns}
            dataSource={filteredProduct}
            loading={isLoading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              showTotal: (total, range) =>
                `Hiển thị ${range[1] - range[0] + 1} sản phẩm trên tổng số ${total} kết quả`,
              onChange: (page, size) => {
                setSearchParams({
                  _page: String(page),
                  _per_page: String(size),
                });
              },
            }}
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
