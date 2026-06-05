import axiosClient from "./axiosClient";

export const GetCustomers = async () => {
  try {
    const res = await axiosClient.get("/customers");
    const data = res.data;

    return data;
  } catch (err) {
    console.log(err);
  }
};

export const DeleteCustomer = async (id: string | number) => {
  try {
    const res = await axiosClient.delete(`/customers/${id}`);
    const data = res.data;

    return data;
  } catch (err) {
    console.log(err);
  }
};

export const GetCustomerById = async (id: number | string) => {
  try {
    const res = await axiosClient.get(`/detail_customers/${id}`);

    const data = res.data;
    return data;
  } catch (err) {
    console.log(err);
  }
};
