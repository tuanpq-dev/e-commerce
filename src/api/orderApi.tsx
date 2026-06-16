import type {
  CreateOrderItemValues,
  CreateOrderValues,
  CustomerType,
  DataType,
  OrderType,
  UpdateStatusValues,
} from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

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
  item: Pick<CreateOrderItemValues, "size" | "color">,
) =>
  getProductVariants(product).find(
    (variant) =>
      String(variant.size) === String(item.size) &&
      String(variant.color) === String(item.color),
  );

const getOrderItemKey = (item: CreateOrderItemValues) =>
  [item.product_id, item.size, item.color]
    .map((value) => String(value))
    .join("|");

export const GetOrders = async (): Promise<OrderType[]> => {
  try {
    const data: OrderType[] =
      (await callApiWithRetries({
        url: "/orders",
      })) ?? [];

    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const GetOrderById = async (id: string | number) => {
  try {
    const data = await callApiWithRetries({
      url: `/orders/${id}`,
    });

    return data;
  } catch (err) {
    console.log(err);
  }
};

export const CreateOrder = async (
  values: CreateOrderValues,
  customers: CustomerType[],
  products: DataType[],
) => {
  const orders = await GetOrders();
  const customer = customers.find(
    (item) => String(item.id) === String(values.customer_id),
  );

  if (!customer) {
    throw new Error("INVALID_CUSTOMER");
  }

  const groupedItems = Array.from(
    (values.items ?? [])
      .filter((item) => item.product_id && item.size && item.color)
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
    };
  });

  const totalPrice = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const now = new Date();

  const payload: OrderType = {
    id: getNextOrderId(orders),
    order_code: getNextOrderCode(orders),
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

  await Promise.all(
    affectedProducts.map((product) => {
      const productOrderItems = orderItems.filter(
        (item) => String(item.product_id) === String(product.id),
      );
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

      return axiosClient.patch(`/products/${product.id}`, {
        stock,
        variants,
      });
    }),
  );

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
  try {
    const data: OrderType[] =
      (await callApiWithRetries({
        url: "/orders",
      })) ?? [];

    const filtered =
      params?.month && params?.year
        ? data.filter((item: OrderType) => {
            if (!item.created_at) {
              return false;
            }

            const date = new Date(item.created_at);

            return (
              date.getMonth() + 1 === params.month &&
              date.getFullYear() === params.year
            );
          })
        : data;

    const total = filtered.reduce(
      (acc: number, item: OrderType) => acc + Number(item.total_price ?? 0),
      0,
    );
    return total;
  } catch (err) {
    console.log(err);
    return 0;
  }
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
