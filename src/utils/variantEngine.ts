/**
 * ═══════════════════════════════════════════════════════════════
 *  VARIANT ENGINE — Logic lõi xử lý nghiệp vụ biến thể động
 * ═══════════════════════════════════════════════════════════════
 *
 *  Hỗ trợ N thuộc tính động (Size, Màu, Chất liệu, Họa tiết, ...)
 *  Quy tắc:
 *   [R1] Key = sort(value_ids).join("-")  → bất biến theo thứ tự chọn
 *   [R2] Giá = base_price + Σ price_modifier_amount
 *   [R3] Stock lưu theo combination key, không theo từng value đơn lẻ
 */

// ─────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

export interface AttributeValue {
  id: string | number;                    // "v_m", "v_red" or 1, 2
  value: string;                 // "M", "Đỏ"
  price_modifier_amount: number; // ±VNĐ so với base_price, thường = 0
}

export interface AttributeGroup {
  titleId: string | number;               // "title_size" or 1, 2
  name: string;                  // "Size"
  values: AttributeValue[];
}

/** { combination_key → { stock } } */
export type VariantMap = Record<string, { stock: number }>;

/** Một tổ hợp đã resolved (dùng trong bảng UI) */
export interface ResolvedCombination {
  key: string;                   // "v_m-v_red"
  valueIds: string[];            // ["v_m", "v_red"]
  labels: string[];              // ["M", "Đỏ"]
  finalPrice: number;
  stock: number;
}

// ─────────────────────────────────────────────────────────────
// 1. generateCombinationKey
// ─────────────────────────────────────────────────────────────

/**
 * [R1] Tạo key chuẩn từ mảng value-ID bất kỳ thứ tự.
 *
 * @example
 *   generateCombinationKey(["v_red", "v_m"])       // → "v_m-v_red"
 *   generateCombinationKey(["v_xl","v_blue","v_co"]) // → "v_blue-v_co-v_xl"
 */
export function generateCombinationKey(valueIds: string[]): string {
  if (!valueIds?.length) {
    throw new Error("[generateCombinationKey] Mảng ID không được rỗng.");
  }
  // Spread → sort alphabet → join: bất biến theo thứ tự đầu vào
  return [...valueIds].sort().join("-");
}

// ─────────────────────────────────────────────────────────────
// 2. generateAllCombinations
// ─────────────────────────────────────────────────────────────

/**
 * Sinh Cartesian Product từ N nhóm thuộc tính.
 * Ví dụ: [Size: S,M] × [Màu: Đỏ,Đen] → 4 tổ hợp.
 *
 * @param groups - Mảng các nhóm thuộc tính đã có values
 * @returns      Mảng mảng value-ID, mỗi phần tử là 1 tổ hợp
 *
 * @example
 *   generateAllCombinations([
 *     { values: [{id:"v_s",...},{id:"v_m",...}] },
 *     { values: [{id:"v_red",...}] }
 *   ])
 *   // → [["v_s","v_red"], ["v_m","v_red"]]
 */
export function generateAllCombinations(groups: AttributeGroup[]): string[][] {
  // Lọc bỏ nhóm không có values
  const activeGroups = groups.filter((g) => g.values.length > 0);
  if (!activeGroups.length) return [];

  // Khởi tạo accumulator với 1 tổ hợp rỗng
  let result: string[][] = [[]];

  for (const group of activeGroups) {
    const next: string[][] = [];

    for (const existing of result) {
      for (const value of group.values) {
        // Thêm value_id của nhóm hiện tại vào từng tổ hợp đang có
        next.push([...existing, String(value.id)]);
      }
    }

    result = next;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// 3. calculateFinalPrice
// ─────────────────────────────────────────────────────────────

/**
 * [R2] Tính giá cuối = base_price + Σ price_modifier_amount của từng value đã chọn.
 *
 * @param basePrice  - Giá sàn của sản phẩm
 * @param groups     - Toàn bộ nhóm thuộc tính (để tra modifier)
 * @param valueIds   - Mảng ID giá trị được chọn trong tổ hợp này
 *
 * @example
 *   // base=500000, v_m modifier=20000, v_red modifier=0
 *   calculateFinalPrice(500000, groups, ["v_m","v_red"]) // → 520000
 */
export function calculateFinalPrice(
  basePrice: number,
  groups: AttributeGroup[],
  valueIds: string[],
): number {
  // Xây Map tra nhanh: valueId → price_modifier_amount
  const modifierMap = new Map<string, number>();
  for (const group of groups) {
    for (const val of group.values) {
      modifierMap.set(String(val.id), val.price_modifier_amount);
    }
  }

  let total = basePrice;
  for (const id of valueIds) {
    const mod = modifierMap.get(id);
    if (mod === undefined) {
      console.warn(`[calculateFinalPrice] Không tìm thấy value ID: "${id}"`);
      continue;
    }
    total += mod;
  }

  return total;
}

// ─────────────────────────────────────────────────────────────
// 4. resolveCombinations
// ─────────────────────────────────────────────────────────────

/**
 * Kết hợp danh sách tổ hợp + variantMap hiện có thành mảng đầy đủ
 * để render trong bảng UI (bao gồm cả tổ hợp chưa có trong variantMap).
 *
 * @param basePrice   - Giá sàn sản phẩm
 * @param groups      - Các nhóm thuộc tính đang active
 * @param variantMap  - Map stock hiện tại (có thể thiếu một số key mới)
 * @returns           Mảng ResolvedCombination đã tính giá + stock
 */
export function resolveCombinations(
  basePrice: number,
  groups: AttributeGroup[],
  variantMap: VariantMap,
): ResolvedCombination[] {
  // Build lookup: valueId → { value label }
  const valueLabel = new Map<string, string>();
  for (const group of groups) {
    for (const val of group.values) {
      valueLabel.set(String(val.id), val.value);
    }
  }

  // Sinh tất cả tổ hợp từ Cartesian Product
  const allCombos = generateAllCombinations(groups);

  return allCombos.map((valueIds) => {
    const key = generateCombinationKey(valueIds);
    const existing = variantMap[key];

    return {
      key,
      valueIds,
      labels: valueIds.map((id) => valueLabel.get(id) ?? id),
      finalPrice: calculateFinalPrice(basePrice, groups, valueIds),
      stock: existing?.stock ?? 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// 5. migrateAttributesOnChange
// ─────────────────────────────────────────────────────────────

/**
 * Migration an toàn khi admin thêm hoặc xóa nhóm thuộc tính.
 *
 * === Khi THÊM nhóm mới ===
 *   Mỗi tổ hợp cũ được nhân với từng value của nhóm mới.
 *   Stock của tổ hợp gốc được giữ nguyên, tổ hợp mới bắt đầu stock = 0.
 *   Ví dụ: { "v_m-v_red": 10 } + nhóm Chất liệu [cotton, polyester]
 *   → { "v_cotton-v_m-v_red": 10, "v_m-v_polyester-v_red": 0 }
 *   (giữ stock ở tổ hợp đầu tiên của mỗi nhóm cũ)
 *
 * === Khi XÓA nhóm ===
 *   Xóa tất cả combination_key chứa bất kỳ value_id nào của nhóm bị xóa.
 *
 * @param oldGroups     - Danh sách nhóm thuộc tính CŨ
 * @param newGroups     - Danh sách nhóm thuộc tính MỚI (sau khi admin thay đổi)
 * @param existingMap   - VariantMap hiện tại (stock data cũ)
 * @returns             VariantMap mới sau migration
 */
export function migrateAttributesOnChange(
  oldGroups: AttributeGroup[],
  newGroups: AttributeGroup[],
  existingMap: VariantMap,
): VariantMap {
  // ── Bước 1: Xác định nhóm bị XÓA → thu thập tất cả value_id của chúng ──
  const oldTitleIds = new Set(oldGroups.map((g) => String(g.titleId)));
  const newTitleIds = new Set(newGroups.map((g) => String(g.titleId)));

  const removedGroups = oldGroups.filter((g) => !newTitleIds.has(String(g.titleId)));
  const removedValueIds = new Set(
    removedGroups.flatMap((g) => g.values.map((v) => String(v.id))),
  );

  // ── Bước 2: Lọc bỏ tất cả key chứa bất kỳ ID của nhóm đã xóa ──────────
  const filteredMap: VariantMap = {};
  for (const [key, data] of Object.entries(existingMap)) {
    const keyParts = key.split("-");
    const hasRemovedId = keyParts.some((part) => removedValueIds.has(part));
    if (!hasRemovedId) {
      filteredMap[key] = data;
    }
  }

  // ── Bước 3: Sinh tất cả tổ hợp mới theo newGroups ───────────────────────
  const newCombos = generateAllCombinations(newGroups);
  const result: VariantMap = {};

  for (const valueIds of newCombos) {
    const newKey = generateCombinationKey(valueIds);

    if (filteredMap[newKey] !== undefined) {
      // Tổ hợp đã tồn tại → giữ nguyên stock
      result[newKey] = filteredMap[newKey];
    } else if (oldTitleIds.size > 0 && newGroups.length > oldGroups.length) {
      // Nhóm mới được thêm vào: tìm key gốc (bỏ các value của nhóm mới)
      const addedGroups = newGroups.filter((g) => !oldTitleIds.has(String(g.titleId)));
      const addedValueIds = new Set(addedGroups.flatMap((g) => g.values.map((v) => String(v.id))));

      const oldValueIds = valueIds.filter((id) => !addedValueIds.has(id));
      const oldKey = oldValueIds.length ? generateCombinationKey(oldValueIds) : null;

      // Kế thừa stock từ key gốc nếu đây là value đầu tiên của nhóm mới
      const inheritedStock = oldKey && filteredMap[oldKey] ? filteredMap[oldKey].stock : 0;
      result[newKey] = { stock: inheritedStock };
    } else {
      // Tổ hợp hoàn toàn mới → stock = 0
      result[newKey] = { stock: 0 };
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// 6. deleteVariantFromMap
// ─────────────────────────────────────────────────────────────

/**
 * Xóa 1 tổ hợp cụ thể khỏi VariantMap (idempotent).
 *
 * @returns VariantMap mới (không mutate bản gốc)
 *
 * @example
 *   deleteVariantFromMap(map, ["v_red", "v_m"])
 *   // → Xóa key "v_m-v_red", trả về map mới
 */
export function deleteVariantFromMap(
  variantMap: VariantMap,
  valueIds: string[],
): VariantMap {
  const key = generateCombinationKey(valueIds);
  if (!(key in variantMap)) return variantMap; // Không tồn tại → không làm gì

  const { [key]: _removed, ...rest } = variantMap;
  return rest;
}

// ─────────────────────────────────────────────────────────────
// 7. applyBulkStock
// ─────────────────────────────────────────────────────────────

/**
 * Áp dụng một giá trị stock cho TOÀN BỘ tổ hợp trong map.
 * Tương ứng với nút "Áp dụng tất cả" trong UI.
 *
 * @returns VariantMap mới (không mutate bản gốc)
 */
export function applyBulkStock(
  variantMap: VariantMap,
  newStock: number,
): VariantMap {
  if (newStock < 0) throw new Error("[applyBulkStock] Stock không được âm.");

  const result: VariantMap = {};
  for (const key of Object.keys(variantMap)) {
    result[key] = { stock: newStock };
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// 8. countAffectedCombinations (helper cho UI warning)
// ─────────────────────────────────────────────────────────────

/**
 * Đếm số tổ hợp sẽ bị xóa khi admin xóa một nhóm thuộc tính.
 * Dùng để hiển thị cảnh báo trước khi xác nhận xóa.
 *
 * @param variantMap   - Map tổ hợp hiện tại
 * @param groupToRemove - Nhóm thuộc tính sắp bị xóa
 * @returns             Số key bị ảnh hưởng
 */
export function countAffectedCombinations(
  variantMap: VariantMap,
  groupToRemove: AttributeGroup,
): number {
  const removedValueIds = new Set(groupToRemove.values.map((v) => String(v.id)));

  return Object.keys(variantMap).filter((key) => {
    const parts = key.split("-");
    return parts.some((part) => removedValueIds.has(part));
  }).length;
}

export function getProductImages(imageVal: string | string[] | undefined | null): string[] {
  if (!imageVal) return [];
  if (Array.isArray(imageVal)) return imageVal;

  const trimmed = imageVal.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  if (trimmed.includes(",")) {
    return trimmed.split(",").map((url) => url.trim());
  }

  return [trimmed];
}
