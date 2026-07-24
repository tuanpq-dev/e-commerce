export interface AttributeValue {
  id: string | number;
  value: string;
  price_modifier_amount: number;
}

export interface AttributeGroup {
  titleId: string | number;
  name: string;
  values: AttributeValue[];
}

export type VariantMap = Record<
  string,
  { stock: number; isDeleted?: boolean; deleted?: boolean }
>;

export interface ResolvedCombination {
  key: string;
  valueIds: string[];
  labels: string[];
  finalPrice: number;
  stock: number;
}

export function generateCombinationKey(valueIds: string[]): string {
  if (!valueIds?.length) {
    throw new Error("[generateCombinationKey] Mảng ID không được rỗng.");
  }
  return [...valueIds].sort().join("-");
}

export function generateAllCombinations(groups: AttributeGroup[]): string[][] {
  const activeGroups = groups.filter((g) => g.values.length > 0);
  if (!activeGroups.length) return [];

  let result: string[][] = [[]];

  for (const group of activeGroups) {
    const next: string[][] = [];

    for (const existing of result) {
      for (const value of group.values) {
        next.push([...existing, String(value.id)]);
      }
    }

    result = next;
  }

  return result;
}

export function calculateFinalPrice(
  basePrice: number,
  groups: AttributeGroup[],
  valueIds: string[],
): number {
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

export function resolveCombinations(
  basePrice: number,
  groups: AttributeGroup[],
  variantMap: VariantMap,
): ResolvedCombination[] {
  const valueLabel = new Map<string, string>();
  for (const group of groups) {
    for (const val of group.values) {
      valueLabel.set(String(val.id), val.value);
    }
  }

  const allCombos = generateAllCombinations(groups);

  const result: ResolvedCombination[] = [];
  for (const valueIds of allCombos) {
    const key = generateCombinationKey(valueIds);
    const existing = variantMap[key] as any;

    if (existing?.isDeleted || existing?.deleted || existing?.stock === -1) {
      continue;
    }

    result.push({
      key,
      valueIds,
      labels: valueIds.map((id) => valueLabel.get(id) ?? id),
      finalPrice: calculateFinalPrice(basePrice, groups, valueIds),
      stock: existing?.stock ?? 0,
    });
  }

  return result;
}

export function migrateAttributesOnChange(
  oldGroups: AttributeGroup[],
  newGroups: AttributeGroup[],
  existingMap: VariantMap,
): VariantMap {
  const oldTitleIds = new Set(oldGroups.map((g) => String(g.titleId)));
  const newTitleIds = new Set(newGroups.map((g) => String(g.titleId)));

  const removedGroups = oldGroups.filter((g) => !newTitleIds.has(String(g.titleId)));
  const removedValueIds = new Set(
    removedGroups.flatMap((g) => g.values.map((v) => String(v.id))),
  );

  const filteredMap: VariantMap = {};
  for (const [key, data] of Object.entries(existingMap)) {
    const keyParts = key.split("-");
    const hasRemovedId = keyParts.some((part) => removedValueIds.has(part));
    if (!hasRemovedId) {
      filteredMap[key] = data;
    }
  }

  const newCombos = generateAllCombinations(newGroups);
  const result: VariantMap = {};

  for (const valueIds of newCombos) {
    const newKey = generateCombinationKey(valueIds);

    if (filteredMap[newKey] !== undefined) {
      result[newKey] = filteredMap[newKey];
    } else if (oldTitleIds.size > 0 && newGroups.length > oldGroups.length) {
      const addedGroups = newGroups.filter((g) => !oldTitleIds.has(String(g.titleId)));
      const addedValueIds = new Set(addedGroups.flatMap((g) => g.values.map((v) => String(v.id))));

      const oldValueIds = valueIds.filter((id) => !addedValueIds.has(id));
      const oldKey = oldValueIds.length ? generateCombinationKey(oldValueIds) : null;

      const inheritedStock = oldKey && filteredMap[oldKey] ? filteredMap[oldKey].stock : 0;
      result[newKey] = { stock: inheritedStock };
    } else {
      result[newKey] = { stock: 0 };
    }
  }

  return result;
}

export function deleteVariantFromMap(
  variantMap: VariantMap,
  valueIds: string[],
): VariantMap {
  const key = generateCombinationKey(valueIds);
  const next = { ...variantMap };
  next[key] = { stock: -1, isDeleted: true } as any;
  return next;
}

export function applyBulkStock(
  variantMap: VariantMap,
  newStock: number,
): VariantMap {
  if (newStock < 0) throw new Error("[applyBulkStock] Stock không được âm.");

  const result: VariantMap = {};
  for (const [key, data] of Object.entries(variantMap)) {
    const isDeleted = (data as any)?.isDeleted || (data as any)?.deleted || data.stock === -1;
    if (isDeleted) {
      result[key] = data;
    } else {
      result[key] = { ...data, stock: newStock };
    }
  }
  return result;
}

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

    }
  }

  if (trimmed.includes(",")) {
    return trimmed.split(",").map((url) => url.trim());
  }

  return [trimmed];
}