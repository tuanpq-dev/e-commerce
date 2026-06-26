import type { CreateCustomerValues, CustomerType } from "../types/domain";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";

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
  search?: string,
): Promise<PaginatedCustomers> => {
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
  const response = (await axiosClient.get<CustomerType[]>("/customers", {
    params,
  })) as AxiosResponse<CustomerType[]>;

  const data: CustomerType[] = response.data ?? [];
  const items: number =
    Number(response.headers["x-total-count"]) || data.length;

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
    created_at: new Date().toISOString(),
  };

  const res = await axiosClient.post("/customers", payload);
  return res.data;
};
