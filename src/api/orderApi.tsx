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

export const GetOrderByOrderCode = async (orderCode: string | number) => {
  try {
    const payload = {
      params: {
        order_code: orderCode,
      },
    };
    const res = await axiosClient.get("/orders", payload);
    const data = res.data?.[0] ?? null;

    return data;
  } catch (err) {
    console.log(err);
  }
};
