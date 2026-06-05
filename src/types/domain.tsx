export interface DataType {
  id?: string | number;
  image: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status?: string;
  description?: string;
}

export type FieldType = {
  email?: string;
  password?: string;
  remember?: string;
};

export type ProductInitialValues = {
  id?: string | number;
  name?: string;
  sku?: string;
  category?: string;
  price?: number | string;
  stock?: number | string;
  description?: string;
  image?: string[];
  status?: string;
};

export type CategoryType = {
  id?: number | string;
  name?: string;
  total?: number | string;
};

export type OrderType = {
  order_code?: number | string;
  customer?: string;
  create_order?: number | string;
  total?: number | string;
  status?: string;
};

export type CustomerType = {
  id?: number | string;
  fullname?: string;
  email?: string;
  total_orders?: number | string;
  total_expend?: number | string;
};

export type UpdateUserPayload = {
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
