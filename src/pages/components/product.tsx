import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Grid, Input, Select, Space, Table, Tag } from "antd";
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
  UpdateProduct,
  UpdateStatusProduct,
} from "../../api/productApi";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import AntButton from "../../@crema/component/AntButton";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import formatDate from "../../utils/formatDate";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useSearchParams } from "react-router-dom";
import { getProductImages } from "../../utils/variantEngine";
import { ProductImageCell } from "./ProductImageCell";

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
    return formatCurrency(record.price ?? record.basePrice ?? 0);
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
  const variants = record.variants || [];
  if (!variants.length) return "Default";
  if (variants.length > 3) return `${variants.length} variants`;

  const labelMap = new Map<string, string>();
  const attrDetails = (record as any).options || record.attributesDetails;
  if (attrDetails) {
    if (
      typeof attrDetails === "object" &&
      !Array.isArray(attrDetails)
    ) {
      Object.values(attrDetails).forEach((group: any) => {
        if (group && Array.isArray(group.values)) {
          group.values.forEach((v: any) => labelMap.set(String(v.id), v.value));
        }
      });
    } else if (Array.isArray(attrDetails)) {
      attrDetails.forEach((group: any) => {
        if (group && Array.isArray(group.values)) {
          group.values.forEach((v: any) => labelMap.set(String(v.id), v.value));
        }
      });
    }
  }

  return variants
    .map((v) => {
      const comboKey = v.comboKey || (v.attributes as any)?.comboKey;
      if (comboKey) {
        return comboKey
          .split("-")
          .map((id: string) => labelMap.get(String(id)) || id)
          .join(" / ");
      }
      return `${v.size || ""}/${v.color || ""}`;
    })
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
const DEFAULT_PER_PAGE = 10;

const Product: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { Search } = Input;
  const { userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rowData, setRowData] = useState<ProductInitialValues | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedPrice, setSelectedPrice] = useState<string>();
  const [product, setProduct] = useState<DataType[]>([]);
  const [category, setCategory] = useState<CategoryType[]>([]);
  const [attributeTitles, setAttributeTitles] = useState<AttributeTitle[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attributeValuePool, setAttributeValuePool] = useState<
    Record<string, import("../../types/domain").AttributeValueItem[]>
  >({});

  const fetchProducts = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = { page: currentPage, pageSize };
      const term = search !== undefined ? search : debouncedSearch;
      if (term.trim()) body.search = term.trim();
      const { data: products, meta: metaData } = await axiosClient.post(
        "/product/search",
        body
      );
      setProduct(products);
      setTotalItems(metaData.totalItems);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 800);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    Promise.all([
      axiosClient.post("/category/search"),
      axiosClient.get("/attribute/pool"),
    ])
      .then(([categoriesRes, attributes]) => {
        const categoryList: any[] = Array.isArray(categoriesRes)
          ? categoriesRes
          : Array.isArray(categoriesRes?.data)
            ? categoriesRes.data
            : [];

        const mapCategoryNode = (node: any): any => {
          const children = node.children || node.child || [];
          return {
            ...node,
            child: children.map(mapCategoryNode),
            children: children.map(mapCategoryNode),
          };
        };
        setCategory(categoryList.map(mapCategoryNode));

        const mappedTitles = (attributes || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
        }));

        const mappedPool: Record<
          string,
          import("../../types/domain").AttributeValueItem[]
        > = {};
        (attributes || []).forEach((item: any) => {
          const rawValues = item.values || [];
          mappedPool[String(item.id)] = rawValues.map(
            (val: any) => ({
              id: String(val.id),
              value: val.value,
              price_modifier_amount: val.priceModifierAmount ?? 0,
            }),
          );
        });

        setAttributeTitles(mappedTitles);
        setAttributeValuePool(mappedPool);
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
      { label: t("product.status.active"), value: "ACTIVE" },
      { label: t("product.status.pending"), value: "INACTIVE" },
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

    try {
      setIsLoading(true);
      await axiosClient.delete(`/product/${rowData.id}`);
      await CreateActiveLog({
        module: "Product",
        action: "DELETE",
        user: userInfo?.fullname || "",
      });

      setIsDeleteModal(false);

      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.deleteSuccess"),
      });

      await fetchProducts();
    } catch (err) {
      openNotification("error", {
        message: t("common.failed"),
        description: typeof err === "string" ? err : String(err || "Đã có lỗi xảy ra, vui lòng thử lại!"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (values: DataType) => {
    // API trả về options hoặc attributesDetails dạng Record<string, {name, values[]}> → convert sang AttributeGroup[]
    const attributesDetailsRaw = (values as any).options || values.attributesDetails;
    const attribute_groups = attributesDetailsRaw && typeof attributesDetailsRaw === "object" && !Array.isArray(attributesDetailsRaw)
      ? Object.entries(attributesDetailsRaw)
        .filter(([titleId]) => !titleId.startsWith("_") && titleId !== "deletedKeys")
        .map(([titleId, group]: [string, any]) => ({
          titleId,
          name: group?.name ?? "",
          values: Array.isArray(group?.values)
            ? group.values.map((v: any) => ({
              id: String(v.id),
              value: v.value,
              price_modifier_amount: v.price_modifier_amount ?? 0,
            }))
            : [],
        }))
      : Array.isArray(attributesDetailsRaw)
        ? attributesDetailsRaw
        : [];

    const categoryObj = typeof values.category === "object" && values.category !== null
      ? (values.category as any)
      : null;

    let parentCategoryId: string | number =
      categoryObj?.id ?? (values as any).categoryId ?? values.category;
    let childCategoryIds: (string | number)[] = getCategoryChildIds(values.category_child);

    if (categoryObj?.parentId !== null && categoryObj?.parentId !== undefined) {
      parentCategoryId = categoryObj.parentId;
      childCategoryIds = [categoryObj.id];
    }

    let variant_map = values.variant_map;
    if (!variant_map && Array.isArray(values.variants)) {
      variant_map = {};
      values.variants.forEach((v: any) => {
        const key = v.comboKey || v.attributes?.comboKey;
        if (key) {
          variant_map![key] = { stock: Number(v.stock ?? 0) };
        }
      });
    }

    setRowData({
      id: values.id,
      name: values.name,
      sku: values.sku,
      category: parentCategoryId,
      category_child: childCategoryIds,
      price: values.price ?? values.basePrice,
      stock: values.stock,
      basePrice: values.basePrice ?? values.price,
      variants: values.variants,
      description: values.description || "",
      attribute_groups,
      variant_map: variant_map ?? {},
      image: getProductImages(values.image),
    });
  };

  const handleChangeStatus = async (status: string, id: number | string) => {
    try {
      await UpdateStatusProduct(status, id);
      await CreateActiveLog({
        module: "Product",
        action: `UPDATE status - ${id}`,
        user: userInfo?.fullname || "",
      });
      openNotification("success", {
        message: t("common.success"),
        description: t("product.notification.updateStatus"),
      });
      await fetchProducts();
    } catch (err) {
      openNotification("error", {
        message: t("common.failed"),
        description: t("product.notification.updateStatusFailed"),
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
      width: 70,
      fixed: !isMobile ? "start" : false,
      render: (image: any) => <ProductImageCell image={image} />,
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
      render: (categoryVal: string | CategoryType | any, record: DataType) => {
        const parentId =
          typeof categoryVal === "object" ? categoryVal?.id : categoryVal;
        const parentName =
          (typeof categoryVal === "object" ? categoryVal?.name : undefined) ??
          categoryMap.get(String(parentId)) ??
          String(parentId ?? "");

        const childIds = (record.category_child ?? [])
          .map((child) => (typeof child === "object" ? child?.id : child))
          .filter((id): id is string | number => id !== undefined);

        const childNames = childIds
          .map((id) => categoryMap.get(String(id)))
          .filter(Boolean)
          .join(", ");

        const categoryText = childNames ? `${parentName} > ${childNames}` : parentName;
        return categoryText ? <Tag color="blue">{categoryText}</Tag> : null;
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
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (_, record) => {
        return record.createdAt ? formatDate(record.createdAt) : "";
      },
    },
    {
      title: t("product.columns.action"),
      key: "action",
      fixed: !isMobile ? "end" : false,
      width: 100,
      // hidden: !isAdmin,
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
    try {
      setIsLoading(true);

      if (isUpdate) {
        if (!rowData?.id) {
          return;
        }

        await Promise.all([
          UpdateProduct({ ...values, id: rowData.id }),
          CreateActiveLog({
            module: "Product",
            action: "UPDATE",
            user: userInfo?.fullname || "",
          }),
        ]);

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
            user: userInfo?.fullname || "",
          })
        ]);

        openNotification("success", {
          message: t("common.success"),
          description: t("product.notification.createSuccess"),
        });
      }

      // Backend uses ES refresh:'wait_for' so data is ready immediately
      await fetchProducts();
      setIsOpenModal(false);
    } catch (err) {
      openNotification("error", {
        message: t("common.failed"),
        description: typeof err === "string" ? err : String(err || "Đã có lỗi xảy ra, vui lòng thử lại!"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: totalItems,
    showSizeChanger: true,
    pageSizeOptions: ["2", "5", "10", "20", "50"],
    showTotal: (total: number, range: [number, number]) =>
      `${t("product.pagination", {
        count: range[1] - range[0] + 1,
        total,
      })}`,
    onChange: (page: number, pageSize: number) => {
      setSearchParams({
        _page: String(page),
        _per_page: String(pageSize),
      });
    },
  };

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <div className="page-toolbar-controls">
            <Search
              allowClear
              placeholder={t("product.placeholder.search")}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value) {
                  setDebouncedSearch("");
                }
              }}
              onSearch={(val) => {
                setSearchInput(val);
                setDebouncedSearch(val);
              }}
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
          {/* {isAdmin && ( */}
          <AntButton
            tooltip={t("common.add")}
            type="primary"
            onClick={handleAdd}
          >
            {t("common.add")}
          </AntButton>
          {/* )} */}
        </div>
        <div className="table-shell">
          <Table<DataType>
            rowKey="sku"
            loading={isLoading}
            columns={columns}
            dataSource={product}
            pagination={paginationConfig}
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
        disabled={!rowData?.id}
        targetName={rowData?.name}
        onOk={handleDelete}
        onCancel={handleCancel}
      />
    </>
  );
};

export default Product;
