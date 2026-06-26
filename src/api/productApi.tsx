import type {
  DataType,
  ProductInitialValues,
  ProductVariant,
  ProductVariantsMap,
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
  // json-server v0.17: dùng _sort + _order thay vì prefix "-"
  const params: Record<string, string | number> = {
    _sort: "created_at",
    _order: "desc",
  };

  if (page !== undefined) {
    params._page = page;
  }
  if (limit !== undefined) {
    params._limit = limit;
  }
  if (search && search.trim()) {
    params.q = search.trim();
  }

  // Dùng axiosClient trực tiếp để đọc header X-Total-Count
  const [productsRes, allVariants] = await Promise.all([
    axiosClient.get<DataType[]>("/products", { params }) as Promise<AxiosResponse<DataType[]>>,
    callApiWithRetries<ProductVariantsMap>({ url: "/product_variants" }),
  ]);

  // json-server v0.17 luôn trả về plain array
  const rawProducts: DataType[] = productsRes.data ?? [];

  // Tổng số bản ghi nằm trong header X-Total-Count
  const items: number = Number(productsRes.headers["x-total-count"]) || rawProducts.length;

  // Merge variants vào sản phẩm dựa trên SKU cha (product.sku)
  const merged = rawProducts.map((product) => {
    const parentSku = product.sku;
    const variants = allVariants[parentSku] ?? product.variants ?? [];

    // Loại bỏ product_id khỏi các variant con khi hiển thị/sử dụng ở client
    const cleanedVariants = variants.map(({ product_id, ...v }) => v);

    return { ...product, variants: cleanedVariants };
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
  // Bước 1: Sinh SKU cha độc nhất
  const parentSku = values.sku || generateUniqueParentSku("SP");
  const productSummary = getProductSummary(values, parentSku);

  // Bước 2: Payload sản phẩm chính (KHÔNG chứa variants)
  const mainProduct = {
    id: parentSku,
    sku: parentSku,
    name: values.name,
    price: productSummary.price,
    stock: productSummary.stock,
    basePrice: Number(values.basePrice) || productSummary.price,
    selectedSizes: values.selectedSizes || [],
    selectedColors: values.selectedColors || [],
    category: values.category,
    category_child: values?.category_child || [],
    description: values.description || "",
    status: "pending",
    created_at: Date.now(),
  };

  // Bước 3: Payload các biến thể con (đã loại bỏ product_id trong normalizeVariants)
  const variantsPayload = productSummary.variants;

  // Bước 4: Gửi 2 request chính song song (mỗi endpoint đúng 1 lần gọi)
  const [res] = await Promise.all([
    axiosClient.post("/products", mainProduct),
    // Gộp toàn bộ biến thể lưu dưới key parentSku trong thực thể product_variants
    axiosClient.patch("/product_variants", {
      [parentSku]: variantsPayload,
    }),
    IncreaseCategoryProductTotal({
      category: values.category,
      category_child: values.category_child,
    }),
  ]);

  return res.data;
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
  const productId = String(id);
  const parentSku = values.sku ? String(values.sku) : productId;
  const productSummary = getProductSummary(values, parentSku);

  // Payload cập nhật sản phẩm chính (KHÔNG chứa variants)
  const mainPayload = {
    price: productSummary.price,
    stock: productSummary.stock,
    basePrice: Number(values.basePrice) || productSummary.price,
    selectedSizes: values.selectedSizes || [],
    selectedColors: values.selectedColors || [],
    name: values.name,
    category: values.category,
    category_child: values.category_child || [],
    description: values.description,
  };

  // Các biến thể mới cần ghi đè cho sản phẩm này
  const variantsPayload = productSummary.variants;

  // Cập nhật song song: thông tin sản phẩm và đè mảng variants cho key parentSku (chỉ 1 API PATCH)
  const [res] = await Promise.all([
    axiosClient.patch(`/products/${id}`, mainPayload),
    axiosClient.patch("/product_variants", {
      [parentSku]: variantsPayload,
    }),
  ]);

  return res.data;
};

// ═══════════════════════════════════════════════════════
//  DELETE — Xóa sản phẩm + xóa key của nó trong product_variants
// ═══════════════════════════════════════════════════════

export const DeleteProduct = async (id: number | string) => {
  const productId = String(id);

  // Lấy thông tin sản phẩm để xác định SKU chính xác
  const product = await callApiWithRetries<DataType>({
    url: `/products/${productId}`,
  }).catch(() => null);

  const parentSku = product?.sku || productId;

  // Lấy toàn bộ map các variants hiện tại
  const allVariants = await callApiWithRetries<ProductVariantsMap>({
    url: "/product_variants",
  });

  // Xóa key của sản phẩm này khỏi object variants
  if (allVariants && allVariants[parentSku]) {
    delete allVariants[parentSku];
  }

  // Chạy song song: xóa sản phẩm chính + cập nhật lại object variants lên server (PUT)
  const [res] = await Promise.all([
    axiosClient.delete(`/products/${id}`),
    axiosClient.put("/product_variants", allVariants),
  ]);

  return res.data;
};

// ═══════════════════════════════════════════════════════
//  UPDATE STATUS — Không thay đổi (không liên quan variants)
// ═══════════════════════════════════════════════════════

export const UpdateStatusProduct = async (
  status: string,
  id: number | string,
) => {
  const payload = { status };
  const res = await axiosClient.patch(`/products/${id}`, payload);
  return res.data;
};
