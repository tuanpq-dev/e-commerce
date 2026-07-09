/**
 * Attribute API — CRUD cho /attribute_titles, /attribute_values và /product_attributes_details
 */
import type { AttributeTitle, AttributeValueItem, AttributeGroup, ProductAttributesDetails } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

// ─────────────────────────────────────────────────────────────
//  ATTRIBUTE TITLES (danh sách nhóm toàn hệ thống)
// ─────────────────────────────────────────────────────────────

/** Lấy toàn bộ danh sách tên nhóm thuộc tính */
export const GetAttributeTitles = async (): Promise<AttributeTitle[]> => {
  return callApiWithRetries<AttributeTitle[]>({ url: "/attribute/pool" });
};

/** Tạo nhóm thuộc tính mới */
export const CreateAttributeTitle = async (name: string): Promise<AttributeTitle> => {
  const id = `title_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  const res = await axiosClient.post("/attribute_titles", { id, name });
  return res.data;
};

/** Xóa nhóm thuộc tính (chỉ xóa khỏi danh sách toàn cục, không ảnh hưởng sản phẩm đã có) */
export const DeleteAttributeTitle = async (id: string): Promise<void> => {
  await axiosClient.delete(`/attribute_titles/${id}`);
};

// ─────────────────────────────────────────────────────────────
//  PRODUCT ATTRIBUTES DETAILS (chi tiết thuộc tính của từng sản phẩm)
// ─────────────────────────────────────────────────────────────

/** Lấy chi tiết thuộc tính của một sản phẩm */
export const GetProductAttributesDetails = async (
  productSku: string,
): Promise<ProductAttributesDetails | null> => {
  const all = await callApiWithRetries<Record<string, ProductAttributesDetails>>({
    url: "/product_attributes_details",
  });
  return all?.[productSku] ?? null;
};

/**
 * Lưu (ghi đè) toàn bộ chi tiết thuộc tính cho một sản phẩm.
 * Chuyển đổi từ mảng AttributeGroup → format lưu trữ.
 */
export const SaveProductAttributesDetails = async (
  productSku: string,
  groups: AttributeGroup[],
): Promise<void> => {
  // Chuyển mảng AttributeGroup → Record<titleId, { name, values }>
  const payload: ProductAttributesDetails = {};
  for (const group of groups) {
    payload[group.titleId] = {
      name: group.name,
      values: group.values,
    };
  }

  await axiosClient.patch("/product_attributes_details", {
    [productSku]: payload,
  });
};

/**
 * Đọc product_attributes_details của một sản phẩm và convert sang mảng AttributeGroup[].
 * Hữu ích khi load form edit.
 */
export const LoadAttributeGroupsForProduct = async (
  productSku: string,
): Promise<AttributeGroup[]> => {
  const details = await GetProductAttributesDetails(productSku);
  if (!details) return [];

  return Object.entries(details).map(([titleId, data]) => ({
    titleId,
    name: data.name,
    values: data.values,
  }));
};

/**
 * Xóa toàn bộ chi tiết thuộc tính của một sản phẩm khi xóa sản phẩm đó.
 */
export const DeleteProductAttributesDetails = async (
  productSku: string,
): Promise<void> => {
  const all = await callApiWithRetries<Record<string, ProductAttributesDetails>>({
    url: "/product_attributes_details",
  });

  if (all && productSku in all) {
    delete all[productSku];
    await axiosClient.put("/product_attributes_details", all);
  }
};

// ─────────────────────────────────────────────────────────────
//  ATTRIBUTE VALUES — Pool giá trị toàn cục theo titleId
//  Lưu tại /attribute_values dạng: { "title_size": [...], ... }
// ─────────────────────────────────────────────────────────────

/** Lấy toàn bộ pool giá trị (tất cả nhóm) */
export const GetAllAttributeValues = async (): Promise<Record<string, AttributeValueItem[]>> => {
  return callApiWithRetries<Record<string, AttributeValueItem[]>>({
    url: "/attribute_values",
  });
};

/** Lấy danh sách giá trị của một nhóm cụ thể */
export const GetAttributeValuesByTitle = async (
  titleId: string,
): Promise<AttributeValueItem[]> => {
  const all = await GetAllAttributeValues();
  return all?.[titleId] ?? [];
};

/**
 * Thêm giá trị mới vào pool của một nhóm.
 * ID tự sinh dạng: v_{titleSlug}_{valueSlug}_{timestamp36}
 */
export const AddAttributeValue = async (
  titleId: string,
  value: string,
  priceModifierAmount = 0,
): Promise<AttributeValueItem> => {
  const all = await GetAllAttributeValues();
  const existing = all[titleId] ?? [];

  // Kiểm tra trùng lặp (case-insensitive)
  const isDuplicate = existing.some(
    (v) => v.value.toLowerCase() === value.trim().toLowerCase(),
  );
  if (isDuplicate) {
    throw new Error(`Giá trị "${value}" đã tồn tại trong nhóm này.`);
  }

  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const newValue: AttributeValueItem = {
    id: `v_${titleId.replace("title_", "")}_${slug}_${Date.now().toString(36)}`,
    value: value.trim(),
    price_modifier_amount: priceModifierAmount,
  };

  const updated = [...existing, newValue];
  await axiosClient.patch("/attribute_values", { [titleId]: updated });

  return newValue;
};

/**
 * Cập nhật price_modifier_amount của một giá trị trong pool.
 */
export const UpdateAttributeValueModifier = async (
  titleId: string,
  valueId: string,
  priceModifierAmount: number,
): Promise<void> => {
  const all = await GetAllAttributeValues();
  const existing = all[titleId] ?? [];

  const updated = existing.map((v) =>
    v.id === valueId ? { ...v, price_modifier_amount: priceModifierAmount } : v,
  );

  await axiosClient.patch("/attribute_values", { [titleId]: updated });
};

/**
 * Xóa một giá trị khỏi pool toàn cục.
 * Không tự động xóa khỏi sản phẩm đang dùng — caller cần tự xử lý.
 */
export const DeleteAttributeValue = async (
  titleId: string,
  valueId: string,
): Promise<void> => {
  const all = await GetAllAttributeValues();
  const existing = all[titleId] ?? [];

  const updated = existing.filter((v) => v.id !== valueId);
  await axiosClient.patch("/attribute_values", { [titleId]: updated });
};

/**
 * Kiểm tra xem một value đang được bao nhiêu sản phẩm sử dụng.
 * Dùng để hiển thị cảnh báo trước khi xóa.
 */
export const CountProductsUsingValue = async (valueId: string): Promise<number> => {
  const allDetails = await callApiWithRetries<Record<string, ProductAttributesDetails>>({
    url: "/product_attributes_details",
  });
  if (!allDetails) return 0;

  let count = 0;
  for (const productDetails of Object.values(allDetails)) {
    for (const group of Object.values(productDetails)) {
      if (group.values.some((v) => v.id === valueId)) {
        count++;
        break; // chỉ đếm 1 lần mỗi sản phẩm
      }
    }
  }
  return count;
};
