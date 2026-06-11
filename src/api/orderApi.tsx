import type { UpdateStatusValues } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export const GetOrders = async () => {
  try {
    const data = await callApiWithRetries({
      url: "/orders",
    });

    return data;
  } catch (err) {
    console.log(err);
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
