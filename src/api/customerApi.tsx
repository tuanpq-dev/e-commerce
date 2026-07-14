import type { CustomerType } from "../types/domain";
import axiosClient from "./axiosClient";

export type PaginatedCustomers = {
  data: CustomerType[];
  items: number;
};

export const DeleteCustomer = async (id: string | number) => {
  const res = await axiosClient.delete(`/customer/${id}`);
  return res.data;
};
