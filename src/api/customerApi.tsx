import type { CreateCustomerValues, CustomerType } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

const normalizeText = (value?: string | number) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export const GetCustomers = async (): Promise<CustomerType[]> => {
  const data = await callApiWithRetries<CustomerType[]>({ url: "/customers" });
  return data;
};

export const DeleteCustomer = async (id: string | number) => {
  const res = await axiosClient.delete(`/customers/${id}`);
  return res.data;
};

export const CreateCustomer = async (values: CreateCustomerValues) => {
  const customers: CustomerType[] = (await GetCustomers()) ?? [];
  const email = normalizeText(values.email);
  const phone = normalizeText(values.phone);

  const existedEmail = customers.some(
    (customer) => normalizeText(customer.email) === email,
  );
  const existedPhone = customers.some(
    (customer) => normalizeText(customer.phone) === phone,
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
  };

  const res = await axiosClient.post("/customers", payload);
  return res.data;
};

export const GetCustomerById = async (id: number | string) => {
  const data = await callApiWithRetries({ url: `/detail_customers/${id}` });
  return data;
};
