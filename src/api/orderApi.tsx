import type {
  AttributeGroup,
  CreateOrderItemValues,
  CreateOrderValues,
  CustomerType,
  DataType,
  OrderType,
} from "../types/domain";
import axiosClient from "./axiosClient";
import { generateCombinationKey } from "../utils/variantEngine";

const getProductVariants = (product: DataType) =>
  product.variants?.length
    ? product.variants
    : [
        {
          size: "Default",
          color: "Default",
          price: product.price,
          stock: product.stock,
          sku: product.sku,
        },
      ];

const getProductAttributeGroups = (product?: DataType): AttributeGroup[] => {
  if (!product) return [];

  let attrDetails = product.attributesDetails;
  if (typeof attrDetails === "string") {
    try {
      attrDetails = JSON.parse(attrDetails);
    } catch (err) {
      attrDetails = undefined;
    }
  }

  if (attrDetails && typeof attrDetails === "object" && !Array.isArray(attrDetails)) {
    return Object.entries(attrDetails).map(([titleId, group]: [string, any]) => ({
      titleId,
      name: group.name,
      values: (group.values || []).map((val: any) => ({
        id: String(val.id),
        value: val.value,
        price_modifier_amount: Number(val.price_modifier_amount || 0),
      })),
    }));
  }

  if (Array.isArray(attrDetails)) {
    return attrDetails;
  }

  return [];
};

const getVariant = (
  product: DataType,
  item: Pick<CreateOrderItemValues, "size" | "color" | "attributes">,
) => {
  const selectedAttrs = item.attributes ?? {};
  const attributeGroups = getProductAttributeGroups(product);

  const isNewSystem = attributeGroups.length > 0 && (product.variants ?? []).some((v) => !!(v as any).comboKey);

  if (isNewSystem) {
    const valueIds = attributeGroups
      .map((g) => selectedAttrs[g.titleId])
      .filter(Boolean);

    const comboKey = generateCombinationKey(valueIds);
    const variant = (product.variants ?? []).find(
      (v) => String((v as any).comboKey) === String(comboKey),
    );

    if (!variant) return undefined;

    const labelMap = new Map<string, string>();
    attributeGroups.forEach((g) => {
      g.values.forEach((v) => {
        labelMap.set(v.id, v.value);
      });
    });
    const labelStr = valueIds.map((id) => labelMap.get(id) ?? id).join(" / ");

    return {
      id: Number(variant.id),
      size: labelStr,
      color: "Default",
      price: Number(variant.price ?? product.price),
      stock: Number(variant.stock),
      sku: product.sku,
      comboKey: comboKey,
    };
  }

  // Legacy system
  const size = selectedAttrs["size"] ?? item.size;
  const color = selectedAttrs["color"] ?? item.color;

  return getProductVariants(product).find(
    (variant) =>
      String(variant.size) === String(size) &&
      String(variant.color) === String(color),
  );
};

const getOrderItemKey = (item: CreateOrderItemValues) => {
  if (item.attributes) {
    const attrKeys = Object.entries(item.attributes)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    return `${item.productId}|attrs:${attrKeys}`;
  }
  return [item.productId, item.size, item.color]
    .map((value) => String(value))
    .join("|");
};

export type PaginatedOrders = {
  data: OrderType[];
  items: number;
};

export const GetOrders = async (
): Promise<PaginatedOrders> => {
  const res = await axiosClient.post("/order/search");
  return {
    data: res.data || [],
    items: res.meta?.totalItems ?? res.data?.length ?? 0,
  };
};

export const GetOrderById = async (id: string | number) => {
  const data = await axiosClient.get(`/order/${id}`)
  return data;
};

export const CreateOrder = async (
  values: CreateOrderValues,
  customers: CustomerType[],
  products: DataType[],
) => {
  const customer = customers.find(
    (item) => String(item.id) === String(values.customerId),
  );

  if (!customer) {
    throw new Error("INVALID_CUSTOMER");
  }

  const groupedItems = Array.from(
    (values.items ?? [])
      .filter((item) => item.productId && (item.attributes || (item.size && item.color)))
      .reduce((acc, item) => {
        const key = getOrderItemKey(item);
        const current = acc.get(key);
        const quantity = Number(item.quantity);

        if (current) {
          current.quantity = Number(current.quantity) + quantity;
          return acc;
        }

        acc.set(key, { ...item, quantity });
        return acc;
      }, new Map<string, CreateOrderItemValues>())
      .values(),
  );

  if (!groupedItems.length) {
    throw new Error("EMPTY_ORDER_ITEMS");
  }

  const orderItems = groupedItems.map((item) => {
    const product = products.find(
      (product) => String(product.id) === String(item.productId),
    );

    if (!product) {
      throw new Error("INVALID_PRODUCT");
    }

    const variant = getVariant(product, item);

    if (!variant) {
      throw new Error("INVALID_VARIANT");
    }

    // Resolve variant ID from database variants
    const comboKey = (variant as any).comboKey;
    const size = variant.size;
    const color = variant.color;
    let variantId: number | undefined;

    if (product.variants && product.variants.length > 0) {
      const dbVariant = product.variants.find((v) => {
        if (comboKey) {
          return String((v as any).comboKey) === String(comboKey);
        }
        return (
          String(v.size) === String(size) && String(v.color) === String(color)
        );
      });
      variantId = dbVariant ? Number(dbVariant.id) : undefined;
    }

    if (!variantId) {
      throw new Error(`Không tìm thấy biến thể hợp lệ cho sản phẩm ${product.name}`);
    }

    const quantity = Number(item.quantity);

    return {
      productId: Number(product.id),
      variantId,
      quantity,
    };
  });

  const payload = {
    customerId: Number(customer.id),
    shippingAddress: values.shippingAddress,
    note: values.note,
    paymentMethod: values.paymentMethod,
    items: orderItems,
  };

  const res = await axiosClient.post("/order", payload);
  return res.data;
};
