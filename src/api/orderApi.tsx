import type { OrderType, UpdateStatusValues } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export const GetOrders = async (): Promise<OrderType[]> => {
  try {
    const data: OrderType[] = (await callApiWithRetries({
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
    const data: OrderType[] = (await callApiWithRetries({
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

  return filtered.reduce(
    (acc, item) => acc + Number(item.total_price ?? 0),
    0,
  );
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
