import type { ProductVariant } from "../types/domain";
import { generateVariantSku } from "./skuGenerator";

/**
 * Sinh Cartesian Product từ mảng sizes × colors.
 * Nếu có existingVariants, giữ lại id/price/stock cũ cho cặp (size, color) đã tồn tại.
 *
 * @param parentSku - SKU cha dùng để sinh SKU con cho mỗi biến thể
 */
export function generateVariants({
  sizes,
  colors,
  basePrice,
  parentSku,
  existingVariants = [],
}: {
  sizes: string[];
  colors: string[];
  basePrice: number;
  parentSku?: string;
  existingVariants?: ProductVariant[];
}): ProductVariant[] {
  if (!sizes.length || !colors.length) {
    return [];
  }

  // Map để tra cứu nhanh biến thể đã tồn tại theo key "size|color"
  const existingMap = new Map<string, ProductVariant>();
  for (const variant of existingVariants) {
    const key = `${variant.size}|${variant.color}`;
    existingMap.set(key, variant);
  }

  const variants: ProductVariant[] = [];

  for (const size of sizes) {
    for (const color of colors) {
      const key = `${size}|${color}`;
      const existing = existingMap.get(key);

      if (existing) {
        // Giữ nguyên dữ liệu cũ (id, price, stock, sku)
        variants.push({ ...existing });
      } else {
        // Sinh mới với giá = basePrice, stock = 0
        // Nếu có parentSku → sinh SKU con chuẩn hóa
        const sku = parentSku
          ? generateVariantSku(parentSku, size, color)
          : undefined;

        variants.push({
          id: crypto.randomUUID(),
          size,
          color,
          price: basePrice,
          stock: 0,
          sku,
        });
      }
    }
  }

  return variants;
}
