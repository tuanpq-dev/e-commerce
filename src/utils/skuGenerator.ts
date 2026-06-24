/**
 * SKU Generator — Tiện ích sinh mã SKU chuẩn hóa
 *
 * Quy tắc:
 *  - SKU cha: [PREFIX] + [Timestamp cơ số 36]  → Ví dụ: "SPV7K1ZB"
 *  - SKU con: [SKU_CHA]-[SIZE]-[COLOR_CODE]    → Ví dụ: "SPV7K1ZB-M-BLK"
 */

// ═══════ BẢNG ÁNH XẠ MÀU → MÃ VIẾT TẮT 3 KÝ TỰ ═══════
export const COLOR_MAP: Record<string, string> = {
  black: "BLK",
  white: "WHT",
  orange: "ORG",
  pink: "PNK",
  blue: "BLU",
  green: "GRN",
  gray: "GRY",
  red: "RED",
  yellow: "YLW",
  purple: "PRL",
  brown: "BRN",
  beige: "BEG",
  navy: "NVY",
  cream: "CRM",
};

/**
 * Tra cứu mã viết tắt từ tên màu tiếng Anh.
 * Nếu không tìm thấy, lấy 3 ký tự đầu viết hoa làm fallback.
 */
export const getColorCode = (colorName: string): string => {
  const normalized = colorName.trim().toLowerCase();
  return COLOR_MAP[normalized] ?? normalized.slice(0, 3).toUpperCase();
};

/**
 * Sinh mã SKU cha độc nhất (Unique Parent SKU).
 * Sử dụng Date.now() chuyển sang cơ số 36 để tối ưu độ dài chuỗi.
 *
 * @param prefix - Tiền tố mặc định "SP" (có thể tùy chỉnh)
 * @returns SKU cha dạng: "SPV7K1ZB"
 */
export const generateParentSku = (prefix = "SP"): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}`;
};

/**
 * Sinh mã SKU cha độc nhất (Unique Parent SKU) - Bí danh tương thích
 */
export const generateUniqueParentSku = (prefix = "SP"): string => {
  return generateParentSku(prefix);
};

/**
 * Sinh mã SKU con từ SKU cha + size + màu.
 *
 * @param parentSku - Mã SKU cha (ví dụ: "SPV7K1ZB")
 * @param size      - Size sản phẩm (ví dụ: "M", "XL")
 * @param color     - Tên màu tiếng Anh (ví dụ: "black")
 * @returns SKU con dạng: "SPV7K1ZB-M-BLK"
 */
export const generateVariantSku = (
  parentSku: string,
  size: string,
  color: string,
): string => {
  const colorCode = getColorCode(color);
  return `${parentSku}-${size.toUpperCase()}-${colorCode}`;
};
