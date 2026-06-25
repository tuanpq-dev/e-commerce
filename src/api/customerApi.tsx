import type { CreateCustomerValues, CustomerType } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

const normalizeText = (value?: string | number) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export type PaginatedCustomers = {
  data: CustomerType[];
  items: number;
};

export const GetCustomers = async (
  page?: number,
  pageSize?: number,
): Promise<PaginatedCustomers> => {
  const params: any = {
    _sort: "-created_at",
  };
  if (page !== undefined) {
    params._page = page;
  }
  if (pageSize !== undefined) {
    params._per_page = pageSize;
  }

  const response = await callApiWithRetries<any>({
    url: "/customers",
    config: {
      params,
    },
  });

  const data: CustomerType[] = Array.isArray(response)
    ? response
    : (response?.data ?? []);

  const items: number = Array.isArray(response)
    ? response.length
    : (response?.items ?? data.length);

  return { data, items };
};

export const DeleteCustomer = async (id: string | number) => {
  const res = await axiosClient.delete(`/customers/${id}`);
  return res.data;
};

export const CreateCustomer = async (values: CreateCustomerValues) => {
  const { data: dataCustomer }: any = (await GetCustomers()) ?? [];
  const email = normalizeText(values.email);
  const phone = normalizeText(values.phone);

  const existedEmail = dataCustomer.some(
    (data: CustomerType) => normalizeText(data.email) === email,
  );
  const existedPhone = dataCustomer.some(
    (data: CustomerType) => normalizeText(data.phone) === phone,
  );

  if (existedEmail) {
    throw new Error("EMAIL_EXISTS");
  }

  if (existedPhone) {
    throw new Error("PHONE_EXISTS");
  }

  const payload: CustomerType = {
    fullname: values.fullname.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    address: values.address?.trim(),
    total_orders: 0,
    total_expend: 0,
    created_at: Date.now(),
  };

  const res = await axiosClient.post("/customers", payload);
  return res.data;
};
