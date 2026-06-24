import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Divider,
  Flex,
  Form,
  InputNumber,
  Modal,
  Table,
  Tag,
} from "antd";
import type { CategoryType, ProductInitialValues } from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";

import { useTranslation } from "react-i18next";
import { generateVariants } from "../../utils/generateVariants";
import formatCurrency from "../../utils/formatCurrecy";
import { generateUniqueParentSku } from "../../utils/skuGenerator";

type ModalProductProps = {
  isUpdate?: boolean;
  initialValue?: ProductInitialValues | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: ProductInitialValues) => void;
  options: CategoryType[];
};

// Trích xuất sizes/colors từ variants hiện có (hỗ trợ backward compat)
const extractAttributesFromVariants = (
  variants: ProductInitialValues["variants"],
) => {
  if (!variants?.length) return { sizes: [], colors: [] };

  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  return { sizes, colors };
};

export const ModalProduct = ({
  isUpdate,
  initialValue,
  open,
  onCancel,
  onOk,
  options,
}: ModalProductProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const selectedCategoryId = Form.useWatch("category", form);

  // State cho bulk apply
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkStock, setBulkStock] = useState<number | null>(null);

  // State cho danh sách biến thể (nằm ngoài Form để kiểm soát Table)
  const [variants, setVariants] = useState<ProductInitialValues["variants"]>(
    [],
  );

  // State lưu SKU cha tạm thời (đồng bộ cho cả tạo mới và cập nhật)
  const [tempParentSku, setTempParentSku] = useState<string>("");

  const selectedCategory = options.find(
    (option) => String(option.id) === String(selectedCategoryId),
  );
  const optionsChild = selectedCategory?.child ?? [];

  const normalizeCategoryChild = (
    categoryChild: ProductInitialValues["category_child"],
  ) =>
    (categoryChild ?? [])
      .map((item) => {
        if (typeof item === "object") {
          return item.id;
        }

        return item;
      })
      .filter((item): item is string | number => item !== undefined);

  const colors = [
    "black",
    "white",
    "orange",
    "pink",
    "blue",
    "green",
    "gray",
    "red",
    "yellow",
    "purple",
    "brown",
    "beige",
    "navy",
    "cream",
  ];

  const colorOptions = colors.map((color) => ({
    value: color,
    label: t(`product.colors.${color}`),
  }));

  const sizeOptions = [
    { value: "XS", label: "XS" },
    { value: "S", label: "S" },
    { value: "M", label: "M" },
    { value: "L", label: "L" },
    { value: "XL", label: "XL" },
    { value: "XXL", label: "XXL" },
  ];

  // Tính toán summary
  const variantSummary = useMemo(() => {
    if (!variants?.length) {
      return { totalStock: 0, minPrice: 0, maxPrice: 0 };
    }

    const totalStock = variants.reduce(
      (sum, v) => sum + Number(v.stock || 0),
      0,
    );
    const prices = variants.map((v) => Number(v.price || 0));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return { totalStock, minPrice, maxPrice };
  }, [variants]);

  // Hàm tái sinh biến thể khi sizes hoặc colors thay đổi
  const regenerateVariants = (
    newSizes?: string[],
    newColors?: string[],
    newBasePrice?: number,
  ) => {
    const currentValues = form.getFieldsValue();
    const sizes = newSizes ?? currentValues.selectedSizes ?? [];
    const colorsVal = newColors ?? currentValues.selectedColors ?? [];
    const basePrice =
      newBasePrice ?? (Number(currentValues.basePrice) || 0);

    const newVariants = generateVariants({
      sizes,
      colors: colorsVal,
      basePrice,
      existingVariants: variants,
      parentSku: tempParentSku, // Truyền SKU cha để sinh SKU con lập tức
    });

    setVariants(newVariants);
  };

  // Áp dụng giá/stock cho tất cả
  const handleBulkApply = () => {
    if (!variants?.length) return;

    const updated = variants.map((v) => ({
      ...v,
      ...(bulkPrice != null ? { price: bulkPrice } : {}),
      ...(bulkStock != null ? { stock: bulkStock } : {}),
    }));

    setVariants(updated);
  };

  // Cập nhật giá/stock cho từng dòng
  const updateVariantField = (
    index: number,
    field: "price" | "stock",
    value: number | null,
  ) => {
    if (!variants) return;

    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value ?? 0 };
    setVariants(updated);
  };

  // Columns cho bảng biến thể
  const variantColumns = [
    {
      title: "#",
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: t("product.variantName"),
      width: 160,
      render: (_: unknown, record: NonNullable<ProductInitialValues["variants"]>[number]) => (
        <span>
          <Tag>{record.size}</Tag>
          <Tag color="blue">
            {t(`product.colors.${record.color}`, record.color)}
          </Tag>
        </span>
      ),
    },
    {
      title: t("product.price"),
      width: 150,
      render: (_: unknown, record: NonNullable<ProductInitialValues["variants"]>[number], index: number) => (
        <InputNumber
          min={0}
          value={Number(record.price)}
          onChange={(val) => updateVariantField(index, "price", val)}
          style={{ width: "100%" }}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => Number(value?.replace(/,/g, "") ?? 0)}
        />
      ),
    },
    {
      title: t("product.stock"),
      width: 120,
      render: (_: unknown, record: NonNullable<ProductInitialValues["variants"]>[number], index: number) => (
        <InputNumber
          min={0}
          value={Number(record.stock)}
          onChange={(val) => updateVariantField(index, "stock", val)}
          style={{ width: "100%" }}
        />
      ),
    },
  ];

  // Khởi tạo form khi mở modal
  const getInitialProductValue = () => {
    if (!initialValue) {
      return {
        variants: [],
        selectedSizes: [],
        selectedColors: [],
        basePrice: undefined,
      };
    }

    // Backward compat: trích xuất sizes/colors từ variants cũ nếu chưa có
    const { sizes: extractedSizes, colors: extractedColors } =
      extractAttributesFromVariants(initialValue.variants);

    return {
      ...initialValue,
      category_child: normalizeCategoryChild(initialValue.category_child),
      selectedSizes: initialValue.selectedSizes ?? extractedSizes,
      selectedColors: initialValue.selectedColors ?? extractedColors,
      basePrice: initialValue.basePrice ?? initialValue.price,
    };
  };

  // Theo dõi selectedSizes thay đổi
  const watchedSizes = Form.useWatch("selectedSizes", form);
  const watchedColors = Form.useWatch("selectedColors", form);
  const watchedBasePrice = Form.useWatch("basePrice", form);

  useEffect(() => {
    if (!open) return;

    // Chỉ regenerate khi cả hai đã có giá trị
    const sizes = watchedSizes ?? [];
    const colorsVal = watchedColors ?? [];

    if (sizes.length > 0 && colorsVal.length > 0) {
      regenerateVariants(sizes, colorsVal, Number(watchedBasePrice) || 0);
    } else {
      setVariants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSizes, watchedColors, open, tempParentSku]);

  return (
    <Modal
      title={isUpdate ? t("product.titleUpdate") : t("product.titleCreate")}
      width="min(960px, calc(100vw - 24px))"
      open={open}
      onOk={async () => {
        const values = await form.validateFields();

        // Validate rằng phải có ít nhất 1 biến thể
        if (!variants?.length) {
          form.setFields([
            {
              name: "selectedSizes",
              errors: [t("product.validation.selectSize")],
            },
          ]);
          return;
        }

        const formattedValues: ProductInitialValues = {
          ...values,
          sku: tempParentSku, // Luôn gửi SKU cha đồng bộ
          basePrice: Number(values.basePrice),
          variants,
        };

        onOk(formattedValues);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (!visible) return;
        form.resetFields();
        setBulkPrice(null);
        setBulkStock(null);

        const initValues = getInitialProductValue();
        form.setFieldsValue(initValues);

        if (isUpdate && initialValue?.sku) {
          setTempParentSku(initialValue.sku);
        } else {
          // Sinh SKU cha độc nhất tạm thời cho sản phẩm mới
          const newSku = generateUniqueParentSku("SP");
          setTempParentSku(newSku);
        }

        // Khôi phục variants từ dữ liệu cũ
        if (initialValue?.variants?.length) {
          setVariants(initialValue.variants);
        } else {
          setVariants([]);
        }
      }}
      afterClose={() => {
        form.resetFields();
        setVariants([]);
        setBulkPrice(null);
        setBulkStock(null);
        setTempParentSku("");
      }}
      destroyOnHidden
      okText={isUpdate ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
      className="product-modal"
    >
      <Form form={form} layout="vertical">
        {/* ═══════ PHẦN 1: THÔNG TIN CƠ BẢN ═══════ */}
        <FormInput
          label={t("product.name")}
          name="name"
          required={true}
          rules={[
            {
              required: true,
              message: t("product.validation.nameRequired"),
            },
            {
              min: 3,
              message: t("product.validation.nameMin"),
            },
            {
              max: 50,
              message: t("product.validation.nameMax"),
            },
          ]}
        />
        {/* SKU: Hiển thị readonly mã SKU cha tự sinh */}
        {tempParentSku && (
          <Form.Item label={t("product.sku")}>
            <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
              {tempParentSku}
            </span>
          </Form.Item>
        )}

        <FormSelect
          label={t("product.category")}
          name="category"
          fieldNames={{ value: "id", label: "name" }}
          options={options}
          placeholder={t("product.selectCategory")}
          rules={[
            {
              required: true,
              message: t("product.validation.categoryRequired"),
            },
          ]}
        />

        {selectedCategoryId && (
          <FormSelect
            label={t("product.categoryChild")}
            name="category_child"
            allowClear={true}
            fieldNames={{ value: "id", label: "name" }}
            mode="multiple"
            options={optionsChild}
            placeholder={t("product.selectCategoryChild")}
          />
        )}

        <FormInput
          label={t("product.basePrice")}
          name="basePrice"
          type="number"
          min={0}
          rules={[
            {
              required: true,
              message: t("product.validation.basePriceRequired"),
            },
          ]}
        />

        {/* ═══════ PHẦN 2: CHỌN THUỘC TÍNH BIẾN THỂ ═══════ */}
        <div className="variant-attributes-section">
          <div className="section-title">
            🏷️ {t("product.variantAttributes")}
          </div>
          <div className="variant-attributes-grid">
            <FormSelect
              label={t("product.size")}
              name="selectedSizes"
              mode="multiple"
              placeholder={t("product.validation.placeholderSize")}
              options={sizeOptions}
              rules={[
                {
                  required: true,
                  message: t("product.validation.selectSize"),
                },
              ]}
            />
            <FormSelect
              label={t("product.color")}
              name="selectedColors"
              mode="multiple"
              placeholder={t("product.validation.placeholderColor")}
              options={colorOptions}
              rules={[
                {
                  required: true,
                  message: t("product.validation.selectColor"),
                },
              ]}
            />
          </div>
        </div>

        {/* ═══════ PHẦN 3: BẢNG MA TRẬN BIẾN THỂ ═══════ */}
        {variants && variants.length > 0 && (
          <>
            <Divider orientation={"left" as any} style={{ margin: "16px 0 8px" }}>
              📦 {t("product.variantList")} ({variants.length})
            </Divider>

            {/* Thanh Áp dụng tất cả */}
            <div className="variant-bulk-apply">
              <Flex vertical style={{ flex: 1 }}>
                <label style={{ fontSize: 12, marginBottom: 4 }}>
                  {t("product.bulkPrice")}
                </label>
                <InputNumber
                  min={0}
                  value={bulkPrice}
                  onChange={setBulkPrice}
                  placeholder={t("product.bulkPrice")}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value?.replace(/,/g, "") ?? 0)}
                />
              </Flex>
              <Flex vertical style={{ flex: 1 }}>
                <label style={{ fontSize: 12, marginBottom: 4 }}>
                  {t("product.bulkStock")}
                </label>
                <InputNumber
                  min={0}
                  value={bulkStock}
                  onChange={setBulkStock}
                  placeholder={t("product.bulkStock")}
                  style={{ width: "100%" }}
                />
              </Flex>
              <Button
                type="primary"
                onClick={handleBulkApply}
                disabled={bulkPrice == null && bulkStock == null}
                style={{ marginBottom: 0 }}
              >
                {t("product.apply")}
              </Button>
            </div>

            {/* Bảng biến thể */}
            <div className="variant-table-wrapper">
              <Table
                rowKey="id"
                columns={variantColumns}
                dataSource={variants}
                pagination={false}
                size="small"
                scroll={{ x: "max-content" }}
              />
            </div>

            {/* Summary footer */}
            <div className="variant-summary">
              <span>
                {t("product.totalStock")}:{" "}
                <strong>{variantSummary.totalStock.toLocaleString()}</strong>
              </span>
              <span>
                {t("product.priceRangeSummary")}:{" "}
                <strong>
                  {variantSummary.minPrice === variantSummary.maxPrice
                    ? formatCurrency(variantSummary.minPrice)
                    : `${formatCurrency(variantSummary.minPrice)} - ${formatCurrency(variantSummary.maxPrice)}`}
                </strong>
              </span>
            </div>
          </>
        )}

        <FormInput
          label={t("product.description")}
          name="description"
          textarea
        />
      </Form>
    </Modal>
  );
};
