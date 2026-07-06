import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Flex, Grid, Image, Input, Select, Space, Table } from "antd";
import type { TableProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type {
  AttributeTitle,
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
import { GetAttributeTitles, GetAllAttributeValues } from "../../api/attributeApi";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { GetCategories } from "../../api/categoryApi";
import AntButton from "../../@crema/component/AntButton";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import formatDate from "../../utils/formatDate";
import { UserPermission } from "../../api/userPermission";
import { useTranslation } from "react-i18next";
import useDebounce from "../../@crema/core/hook/useDebounce";

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
  // ── Cấu trúc mới: hiển thị tổ hợp từ variant_map ────────────────
  if (record.variant_map) {
    const keys = Object.keys(record.variant_map);
    if (!keys.length) return "Chưa có tổ hợp";
    if (keys.length > 4) return `${keys.length} tổ hợp`;

    // Dùng value labels từ attribute_groups nếu có
    if (record.attribute_groups?.length) {
      const labelMap = new Map<string, string>();
      for (const g of record.attribute_groups) {
        for (const v of g.values) labelMap.set(v.id, v.value);
      }
      return keys
        .slice(0, 4)
        .map((key) =>
          key
            .split("-")
            .map((id) => labelMap.get(id) ?? id)
            .join(" / "),
        )
        .join(", ");
    }
    return keys.slice(0, 4).join(", ");
  }

  // ── Legacy: hiển thị variants[] ────────────────────────────────
  const variants = getProductVariants(record);
  if (!variants.length) return "Default";
  if (variants.length > 3) return `${variants.length} variants`;
  return variants.map((v) => `${v.size}/${v.color}`).join(", ");
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
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedPrice, setSelectedPrice] = useState<string>();
  const [product, setProduct] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<CategoryType[]>([]);
  const [attributeTitles, setAttributeTitles] = useState<AttributeTitle[]>([]);
  const [attributeValuePool, setAttributeValuePool] = useState<Record<string, import("../../types/domain").AttributeValueItem[]>>({});
  const { isAdmin } = UserPermission();

  // ─── Pagination đồng bộ URL ───────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalItems, setTotalItems] = useState(0);

  // Bóc tách _page và _per_page từ URL, fallback về giá trị mặc định
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const searchText = searchParams.get("q") ?? "";

  // State quản lý giá trị đang gõ vào ô tìm kiếm (có debounce 500ms)
  const [searchInput, setSearchInput] = useState(searchText);
  const debouncedSearchText = useDebounce(searchInput, 500);

  // Khi URL thay đổi từ bên ngoài (ví dụ: xóa query), đồng bộ lại input
  useEffect(() => {
    setSearchInput(searchText);
  }, [searchText]);

  // Khi giá trị debounce thay đổi, cập nhật URL params
  useEffect(() => {
    if (debouncedSearchText.trim() !== searchText.trim()) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const keyword = debouncedSearchText.trim();
        if (keyword) {
          next.set("q", keyword);
          next.set("_page", String(DEFAULT_PAGE));
        } else {
          next.delete("q");
          next.delete("_page");
        }
        return next;
      });
    }
  }, [debouncedSearchText, searchText, setSearchParams]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, items } = await GetProducts(
        currentPage,
        pageSize,
        searchText,
      );
      setProduct(data);
      setTotalItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchText]);

  // Gọi API khi page/pageSize (từ URL) thay đổi
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    GetCategories()
      .then((res) => setCategory(res.data))
      .catch(console.error);
    Promise.all([GetAttributeTitles(), GetAllAttributeValues()])
      .then(([titles, pool]) => {
        setAttributeTitles(titles);
        setAttributeValuePool(pool ?? {});
      })
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

    await DeleteProduct(rowData.id);
    await CreateActiveLog({
      module: "Product",
      action: "DELETE",
      user: userInfo?.name,
    });

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
      attribute_groups: values.attribute_groups,
      variant_map: values.variant_map,
    });
  };

  const handleChangeStatus = async (status: string, id: number | string) => {
    try {
      await UpdateStatusProduct(status, id);
      await CreateActiveLog({
        module: "Product",
        action: `UPDATE status - ${id}`,
        user: userInfo?.name,
      });
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

      await UpdateProduct({ ...values, id: rowData.id });
      await CreateActiveLog({
        module: "Product",
        action: "UPDATE",
        user: userInfo?.name,
      });

      await fetchProducts();
      setIsOpenModal(false);
      setIsUpdate(false);
      setRowData(null);

      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.updateSuccess"),
      });
    } else {
      await CreateProduct(values);
      await CreateActiveLog({
        module: "Product",
        action: "CREATE",
        user: userInfo?.name,
      });

      await fetchProducts();
      setIsOpenModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.createSuccess"),
      });
    }
  };

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <div className="page-toolbar-controls">
            <Search
              allowClear={true}
              placeholder={t("product.placeholder.search")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            dataSource={product}
            loading={isLoading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              showTotal: (total, range) =>
                t("product.pagination", { count: range[1] - range[0] + 1, total }),
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
        attributeTitles={attributeTitles}
        attributeValuePool={attributeValuePool}
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
