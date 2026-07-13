import type {
  DataType,
  ProductInitialValues,
  ProductVariant,
  ProductVariantsMap,
  AttributeGroup,
  VariantCombinationMap,
} from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";
import type { AxiosResponse } from "axios";
import { IncreaseCategoryProductTotal } from "./categoryApi";
import {
  generateUniqueParentSku,
  generateVariantSku,
  getColorCode,
} from "../utils/skuGenerator";

import { calculateFinalPrice } from "../utils/variantEngine";

// ═══════════════════════════════════════════════════════
//  GET — Lấy danh sách sản phẩm + merge variants
// ═══════════════════════════════════════════════════════

/**
 * Response phân trang từ json-server v0.17.
 * - `data`: mảng sản phẩm đã merge variants.
 * - `items`: tổng số sản phẩm (đọc từ header X-Total-Count).
 */
export type PaginatedProducts = {
  data: DataType[];
  items: number;
};

export const GetProducts = async (
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedProducts> => {
  const params: Record<string, string | number> = {
    _sort: "created_at",
    _order: "desc",
  };

  if (page !== undefined) params._page = page;
  if (limit !== undefined) params._limit = limit;
  if (search?.trim()) params.q = search.trim();

  const [productsRes, allVariants, allAttrDetails] = await Promise.all([
    axiosClient.get<DataType[]>("/products", { params }) as Promise<AxiosResponse<DataType[]>>,
    callApiWithRetries<Record<string, VariantCombinationMap>>({ url: "/product_variants" }),
    callApiWithRetries<Record<string, Record<string, { name: string; values: { id: string; value: string; price_modifier_amount: number }[] }>>>({
      url: "/product_attributes_details",
    }),
  ]);

  const rawProducts: DataType[] = productsRes.data ?? [];
  const items: number = Number(productsRes.headers["x-total-count"]) || rawProducts.length;

  const merged = rawProducts.map((product) => {
    const parentSku = product.sku;

    // ── Merge attribute_groups từ product_attributes_details ───────────
    const attrDetails = allAttrDetails?.[parentSku];
    const attribute_groups: AttributeGroup[] = attrDetails
      ? Object.entries(attrDetails).map(([titleId, data]) => ({
          titleId,
          name: data.name,
          values: data.values,
        }))
      : [];

    // ── Merge variant_map (cấu trúc mới) ─────────────────────────
    const rawVariantEntry = (allVariants as Record<string, unknown>)?.[parentSku];
    const isNewFormat =
      rawVariantEntry !== null &&
      typeof rawVariantEntry === "object" &&
      !Array.isArray(rawVariantEntry) &&
      Object.values(rawVariantEntry as object).every(
        (v) => typeof v === "object" && v !== null && "stock" in v,
      );

    const variant_map: VariantCombinationMap = isNewFormat
      ? (rawVariantEntry as VariantCombinationMap)
      : {};

    // ── Backward compat: giữ variants[] cho sản phẩm legacy ──────────
    const legacyVariants: ProductVariant[] = !isNewFormat
      ? ((allVariants as ProductVariantsMap)?.[parentSku] ?? product.variants ?? [])
      : [];
    const cleanedVariants = legacyVariants.map(({ product_id, ...v }) => v);

    return {
      ...product,
      attribute_groups,
      variant_map,
      variants: cleanedVariants,
    };
  });

  return { data: merged, items };
};

// ═══════════════════════════════════════════════════════
//  SKU & VARIANT HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Sinh SKU con legacy (fallback cho sản phẩm cũ chưa có parentSku)
 */
const createVariantSkuLegacy = (
  productSku: ProductInitialValues["sku"],
  variant: ProductVariant,
) =>
  [productSku, variant.size, getColorCode(variant.color)]
    .filter(Boolean)
    .map((item) => String(item).trim().replace(/\s+/g, "-").toUpperCase())
    .join("-");

/**
 * Chuẩn hóa variants: đảm bảo mỗi variant có id, price (number), stock (number), sku và loại bỏ product_id
 */
const normalizeVariants = (
  values: ProductInitialValues,
  parentSku?: string,
): ProductVariant[] => {
  const variants = values.variants ?? [];

  return variants
    .filter((variant) => variant.size || variant.color)
    .map((variant) => {
      return {
        ...variant,
        id: variant.id ?? crypto.randomUUID(),
        price: Number(variant.price),
        stock: Number(variant.stock),
        sku:
          variant.sku ||
          (parentSku
            ? generateVariantSku(parentSku, variant.size, variant.color)
            : createVariantSkuLegacy(values.sku, variant)),
      };
    });
};

/**
 * Tính summary: price min, tổng stock từ danh sách variants
 */
const getProductSummary = (
  values: ProductInitialValues,
  parentSku?: string,
) => {
  const variants = normalizeVariants(values, parentSku);

  if (!variants.length) {
    return {
      price: Number(values.price),
      stock: Number(values.stock),
      variants,
    };
  }

  return {
    price: Math.min(...variants.map((variant) => Number(variant.price))),
    stock: variants.reduce(
      (total, variant) => total + Number(variant.stock),
      0,
    ),
    variants,
  };
};

// ═══════════════════════════════════════════════════════
//  CREATE & SUBMIT — Gom variants lưu chỉ bằng 1 API call
// ═══════════════════════════════════════════════════════

/**
 * Gom toàn bộ thông tin sản phẩm và các biến thể con, thực hiện đúng 1 API call để lưu biến thể.
 */
export const handleSubmitProduct = async (values: ProductInitialValues) => {
  const parentSku = values.sku || generateUniqueParentSku("SP");

  // ── Xác định chế độ: mới (N-attribute) hay legacy (size+color) ────────
  const isNewAttributeSystem = !!(values.attribute_groups?.length);

  if (isNewAttributeSystem) {
    // ── CHẾ ĐỘ: Lưu theo cấu trúc mới (NestJS Backend DTO) ───────────
    const variantMap: VariantCombinationMap = values.variant_map ?? {};
    const stock = Object.values(variantMap).reduce((sum, v) => sum + (v.stock ?? 0), 0);
    const price = Number(values.basePrice) || 0;

    // Map attributesDetails
    const attributesDetails: Record<string, any> = {};
    for (const group of values.attribute_groups!) {
      attributesDetails[group.titleId] = {
        name: group.name,
        values: group.values.map(val => ({
          id: String(val.id),
          value: val.value,
          price_modifier_amount: val.price_modifier_amount
        }))
      };
    }

    // Map variants to flat array expected by BE
    const variantsArray = Object.entries(variantMap).map(([comboKey, info]) => ({
      comboKey,
      stock: Number(info.stock),
      price: calculateFinalPrice(
        price,
        values.attribute_groups!,
        comboKey.split("-")
      )
    }));

    let finalCategoryId = typeof values.category === "object" && values.category !== null
      ? Number((values.category as any).id)
      : Number(values.category);

    if (values.category_child && values.category_child.length > 0) {
      const firstChild = values.category_child[0];
      finalCategoryId = Number(typeof firstChild === "object" ? (firstChild as any).id : firstChild);
    }

    const createProductDto: any = {
      sku: parentSku,
      name: values.name,
      price,
      basePrice: price,
      stock,
      description: values.description || "",
      attributesDetails,
      variants: variantsArray
    };

    if (!isNaN(finalCategoryId)) {
      createProductDto.categoryId = finalCategoryId;
    }

    const res = await axiosClient.post("/product", createProductDto);
    return res;
  } else {
    // ── LEGACY: giữ nguyên code cũ ─────────────────────────────────
    const productSummary = getProductSummary(values, parentSku);
    const price = productSummary.price;
    const stock = productSummary.stock;
    const variantsPayload = productSummary.variants;

    const mainProduct = {
      id: values.id,
      sku: parentSku,
      name: values.name,
      price,
      stock,
      basePrice: Number(values.basePrice) || price,
      attribute_title_ids: values.attribute_groups?.map((g) => g.titleId) ?? [],
      selectedSizes: values.selectedSizes || [],
      selectedColors: values.selectedColors || [],
      category: values.category,
      category_child: values?.category_child || [],
      description: values.description || "",
      status: "pending",
      created_at: Date.now(),
    };

    const res = await axiosClient.post("/product", mainProduct);
    await axiosClient.patch("/product_variants", { [parentSku]: variantsPayload });
    await IncreaseCategoryProductTotal({
      category: values.category,
      category_child: values.category_child,
    });

    return res;
  }
};

// Xuất CreateProduct tương thích ngược với component cũ
export const CreateProduct = handleSubmitProduct;

// ═══════════════════════════════════════════════════════
//  UPDATE — Cập nhật product + ghi đè key trong product_variants
// ═══════════════════════════════════════════════════════

type UpdateProductValues = Omit<ProductInitialValues, "id"> & {
  id: string | number;
};

export const UpdateProduct = async ({ id, ...values }: UpdateProductValues) => {
  const isNewAttributeSystem = !!(values.attribute_groups?.length);

  let price = Number(values.price) || 0;
  let stock = Number(values.stock) || 0;
  let variantsArray: any[] = [];
  let attributesDetails: any = {};

  if (isNewAttributeSystem) {
    const variantMap: VariantCombinationMap = values.variant_map ?? {};
    stock = Object.values(variantMap).reduce((sum, v) => sum + (v.stock ?? 0), 0);
    price = Number(values.basePrice) || 0;

    // Convert attribute_groups to attributesDetails
    for (const group of values.attribute_groups!) {
      attributesDetails[group.titleId] = {
        name: group.name,
        values: group.values.map(val => ({
          id: String(val.id),
          value: val.value,
          price_modifier_amount: val.price_modifier_amount
        }))
      };
    }

    // Map variants to flat array expected by BE
    variantsArray = Object.entries(variantMap).map(([comboKey, info]) => ({
      comboKey,
      stock: Number(info.stock),
      price: calculateFinalPrice(
        price,
        values.attribute_groups!,
        comboKey.split("-")
      )
    }));
  }

  let finalCategoryId = typeof values.category === "object" && values.category !== null
    ? Number((values.category as any).id)
    : Number(values.category);

  if (values.category_child && values.category_child.length > 0) {
    const firstChild = values.category_child[0];
    finalCategoryId = Number(typeof firstChild === "object" ? (firstChild as any).id : firstChild);
  }

  const updateProductDto: any = {
    name: values.name,
    price,
    basePrice: Number(values.basePrice) || price,
    stock,
    description: values.description || "",
    attributesDetails,
    variants: variantsArray,
  };

  if (!isNaN(finalCategoryId)) {
    updateProductDto.categoryId = finalCategoryId;
  }

  const res = await axiosClient.patch(`/product/${id}`, updateProductDto);
  return res;
};

// ═══════════════════════════════════════════════════════
//  DELETE — Xóa sản phẩm + xóa key của nó trong product_variants
// ═══════════════════════════════════════════════════════

export const DeleteProduct = async (id: number | string) => {
  const productId = String(id);

  const product = await callApiWithRetries<DataType>({
    url: `/product/${productId}`,
  }).catch(() => null);

  const parentSku = product?.sku || productId;

  const allVariants = await callApiWithRetries<Record<string, unknown>>({
    url: "/product_variants",
  });

  if (allVariants && parentSku in allVariants) {
    delete allVariants[parentSku];
  }

  const res = await axiosClient.delete(`/product/${id}`);
  await axiosClient.put("/product_variants", allVariants);

  return res;
};

// ═══════════════════════════════════════════════════════
//  UPDATE STATUS — Không thay đổi (không liên quan variants)
// ═══════════════════════════════════════════════════════

export const UpdateStatusProduct = async (
  status: string,
  id: number | string,
) => {
  const payload = { status };
  const res = await axiosClient.patch(`/product/${id}`, payload);
  return res;
};
