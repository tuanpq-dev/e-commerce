import type {
  CreateOrderItemValues,
  CreateOrderValues,
  CustomerType,
  DataType,
  OrderType,
  UpdateStatusValues,
} from "../types/domain";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";
import { generateCombinationKey } from "../utils/variantEngine";

const getNextOrderCode = (orders: OrderType[]) => {
  const nextNumber =
    Math.max(
      0,
      ...orders.map((order) => {
        const match = String(order.order_code ?? "").match(/^ORD(\d+)$/);
        return match ? Number(match[1]) : 0;
      }),
    ) + 1;

  return `ORD${String(nextNumber).padStart(3, "0")}`;
};

const getNextOrderId = (orders: OrderType[]) => {
  const nextId =
    Math.max(
      0,
      ...orders.map((order) => {
        const id = Number(order.id);
        return Number.isFinite(id) ? id : 0;
      }),
    ) + 1;

  return String(nextId);
};

const getFirstImage = (image?: DataType["image"]) => {
  if (Array.isArray(image)) {
    return image[0] ?? "";
  }

  return image ?? "";
};

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

const getVariant = (
  product: DataType,
  item: Pick<CreateOrderItemValues, "size" | "color" | "attributes">,
) => {
  const selectedAttrs = item.attributes ?? {};

  // New dynamic N-attribute system
  if (product.variant_map && Object.keys(product.variant_map).length > 0) {
    const attributeGroups = product.attribute_groups ?? [];
    const valueIds = attributeGroups
      .map((g) => selectedAttrs[g.titleId])
      .filter(Boolean);

    const comboKey = generateCombinationKey(valueIds);
    const stockData = product.variant_map[comboKey ?? ""];
    if (!stockData) return undefined;

    // Calculate final price: basePrice + sum of modifiers
    const basePrice = Number(product.basePrice ?? product.price ?? 0);
    let price = basePrice;
    if (product.attribute_groups) {
      const modifierMap = new Map<string, number>();
      for (const g of product.attribute_groups) {
        for (const v of g.values) {
          modifierMap.set(v.id, v.price_modifier_amount);
        }
      }
      price += valueIds.reduce((sum, id) => sum + (modifierMap.get(id) ?? 0), 0);
    }

    // Build label string
    const labelMap = new Map<string, string>();
    if (product.attribute_groups) {
      for (const g of product.attribute_groups) {
        for (const v of g.values) {
          labelMap.set(v.id, v.value);
        }
      }
    }
    const labelStr = valueIds.map((id) => labelMap.get(id) ?? id).join(" / ");

    return {
      size: labelStr,
      color: "Default",
      price: price,
      stock: stockData.stock,
      sku: product.sku,
      comboKey: comboKey, // Pass comboKey through for stock deduction
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
    return `${item.product_id}|attrs:${attrKeys}`;
  }
  return [item.product_id, item.size, item.color]
    .map((value) => String(value))
    .join("|");
};

export type PaginatedOrders = {
  data: OrderType[];
  items: number;
};

export const GetOrders = async (
  page?: number,
  pageSize?: number,
  search?: string,
): Promise<PaginatedOrders> => {
  // json-server v0.17: dùng _sort + _order thay vì prefix "-"
  const params: Record<string, string | number> = {
    _sort: "created_at",
    _order: "desc",
  };
  if (page !== undefined) {
    params._page = page;
  }
  if (pageSize !== undefined) {
    params._limit = pageSize;
  }
  if (search && search.trim()) {
    params.q = search.trim();
  }

  // Dùng axiosClient trực tiếp để đọc header X-Total-Count
  const response = await axiosClient.get<OrderType[]>("/orders", { params }) as AxiosResponse<OrderType[]>;

  const data: OrderType[] = response.data ?? [];
  const items: number = Number(response.headers["x-total-count"]) || data.length;

  return { data, items };
};

export const GetOrderById = async (id: string | number) => {
  const data = await callApiWithRetries({ url: `/orders/${id}` });
  return data;
};

export const CreateOrder = async (
  values: CreateOrderValues,
  customers: CustomerType[],
  products: DataType[],
) => {
  const { data: orderList } = await GetOrders();
  const customer = customers.find(
    (item) => String(item.id) === String(values.customer_id),
  );

  if (!customer) {
    throw new Error("INVALID_CUSTOMER");
  }

  const groupedItems = Array.from(
    (values.items ?? [])
      .filter((item) => item.product_id && (item.attributes || (item.size && item.color)))
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
      (product) => String(product.id) === String(item.product_id),
    );

    if (!product) {
      throw new Error("INVALID_PRODUCT");
    }

    const variant = getVariant(product, item);

    if (!variant) {
      throw new Error("INVALID_VARIANT");
    }

    const quantity = Number(item.quantity);
    const stock = Number(variant.stock);

    if (quantity < 1 || quantity > stock) {
      throw new Error(
        `${product.name} ${variant.size}/${variant.color} không đủ tồn kho`,
      );
    }

    return {
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      image: getFirstImage(product.image),
      quantity,
      price: Number(variant.price),
      comboKey: (variant as any).comboKey, // Pass comboKey through for stock deduction
    };
  });

  const totalPrice = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const now = new Date();

  const payload: OrderType = {
    id: getNextOrderId(orderList),
    order_code: getNextOrderCode(orderList),
    customer_id: customer.id,
    customer_name: customer.fullname,
    customer_email: customer.email,
    created_at: new Date().toISOString(),
    total_price: totalPrice,
    payment_method: values.payment_method,
    payment_status: "unpaid",
    shipping_status: "pending",
    status: "pending",
    shipping_address: values.shipping_address,
    note: values.note,
    items: orderItems,
    historyDetailOrder: [
      {
        status: "pending",
        message: "Đã tạo đơn hàng",
        createdAt: now.toISOString(),
        updatedBy: {
          name: "System",
        },
      },
    ],
  };

  const res = await axiosClient.post("/orders", payload);
  const affectedProducts = products.filter((product) =>
    orderItems.some((item) => String(item.product_id) === String(product.id)),
  );

  for (const product of affectedProducts) {
    const productOrderItems = orderItems.filter(
      (item) => String(item.product_id) === String(product.id),
    );

    const isNewSystem = !!product.variant_map && Object.keys(product.variant_map).length > 0;

    if (isNewSystem) {
      // ── New dynamic N-attribute system ──
      // 1. Deduct stock from the dynamic variant_map
      const updatedVariantMap = { ...product.variant_map };
      for (const item of productOrderItems) {
        const comboKey = item.comboKey;
        if (comboKey && updatedVariantMap[comboKey]) {
          updatedVariantMap[comboKey] = {
            stock: Math.max(0, updatedVariantMap[comboKey].stock - item.quantity),
          };
        }
      }

      // 2. Sum up total stock
      const totalStock = Object.values(updatedVariantMap).reduce(
        (sum, v) => sum + v.stock,
        0,
      );

      // 3. Update both /products and /product_variants sequentially
      await axiosClient.patch(`/products/${product.id}`, {
        stock: totalStock,
      });
      await axiosClient.patch("/product_variants", {
        [product.sku]: updatedVariantMap,
      });
    } else {
      // ── Legacy system ──
      const variants = product.variants?.length
        ? product.variants.map((variant) => {
            const orderedQuantity = productOrderItems
              .filter(
                (item) =>
                  String(item.size) === String(variant.size) &&
                  String(item.color) === String(variant.color),
              )
              .reduce((total, item) => total + Number(item.quantity), 0);

            return {
              ...variant,
              stock: Number(variant.stock) - orderedQuantity,
            };
          })
        : [];
      const stock = variants.length
        ? variants.reduce((total, variant) => total + Number(variant.stock), 0)
        : Number(product.stock) -
          productOrderItems.reduce(
            (total, item) => total + Number(item.quantity),
            0,
          );

      await axiosClient.patch(`/products/${product.id}`, {
        stock,
        variants,
      });
    }
  }

  return res.data;
};

export const UpdateStatusDetailOrder = async (values: UpdateStatusValues) => {
  const oldHistory = values.historyDetailOrder ?? [];

  const payload = {
    status: values.status,
    historyDetailOrder: [
      ...oldHistory,
      {
        status: values.status,
        message: `Đã đổi trạng thái sang ${values.status}`,
        createdAt: new Date().toISOString(),
        updatedBy: values.updatedBy,
      },
    ],
  };

  const res = await axiosClient.patch(`/orders/${values.id}`, payload);

  return res.data;
};

export const getTotalOrder = async (params?: {
  month?: number;
  year?: number;
}) => {
  const data = await callApiWithRetries<OrderType[]>({ url: "/orders" });

  const filtered =
    params?.month && params?.year
      ? (data ?? []).filter((item: OrderType) => {
          if (!item.created_at) {
            return false;
          }

          const date = new Date(item.created_at);

          return (
            date.getMonth() + 1 === params.month &&
            date.getFullYear() === params.year
          );
        })
      : (data ?? []);

  return filtered.reduce(
    (acc: number, item: OrderType) => acc + Number(item.total_price ?? 0),
    0,
  );
};

export const getTotalRevenueFromOrders = (
  orders: OrderType[],
  params?: {
    month?: number;
    year?: number;
  },
) => {
  const filtered =
    params?.month && params?.year
      ? orders.filter((item) => {
          if (!item.created_at) {
            return false;
          }

          const date = new Date(item.created_at);

          return (
            date.getMonth() + 1 === params.month &&
            date.getFullYear() === params.year
          );
        })
      : orders;

  return filtered.reduce((acc, item) => acc + Number(item.total_price ?? 0), 0);
};

export const getOrdersByDayOfMonth = (
  orders: OrderType[],
): { labels: string[]; data: number[] } => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const labels = Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1),
  );
  const data = Array.from({ length: daysInMonth }, () => 0);

  orders.forEach((order) => {
    if (!order.created_at) {
      return;
    }

    const [year, month, day] = order.created_at
      .split("T")[0]
      .split("-")
      .map(Number);

    if (year === currentYear && month === currentMonth && day) {
      data[day - 1] += 1;
    }
  });

  return { labels, data };
};
