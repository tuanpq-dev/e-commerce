import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export const GetCustomers = async () => {
  try {
    const data = await callApiWithRetries({
      url: "/customers",
    });

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
    const data = await callApiWithRetries({
      url: `/detail_customers/${id}`,
    });
    return data;
  } catch (err) {
    console.log(err);
  }
};
