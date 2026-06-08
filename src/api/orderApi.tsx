import type { UpdateStatusValues } from "../types/domain";
import axiosClient from "./axiosClient";

export const GetOrders = async () => {
  try {
    const res = await axiosClient.get("/orders");
    const data = res.data;

    return data;
  } catch (err) {
    console.log(err);
  }
};

export const GetOrderById = async (id: string | number) => {
  try {
    const res = await axiosClient.get(`/orders/${id}`);
    const data = res.data;

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
