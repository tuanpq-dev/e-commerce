export type ProductVariant = {
  id?: string | number;
  size: string;
  color: string;
  price: number | string;
  stock: number | string;
  sku?: string;
};

export interface DataType {
  id?: string | number;
  image: string | string[];
  sku: string;
  name: string;
  category: string | CategoryType;
  category_child?: (string | number | CategoryType)[];
  price: number;
  stock: number;
  status?: string;
  description?: string;
  variants?: ProductVariant[];
  created_at?: string | number;
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
  category?: string | number | CategoryType;
  category_child?: (string | number | CategoryType)[];
  price?: number | string;
  stock?: number | string;
  description?: string;
  image?: string[];
  status?: string;
  variants?: ProductVariant[];
};

export type CategoryType = {
  id?: number | string;
  name?: string;
  total?: number | string;
  parentId?: number | string;
  child?: CategoryType[];
  category_child?: number;
  total_prod?: number | string;
};

export type OrderType = {
  id?: number | string;
  order_code?: number | string;
  customer_id?: number | string;
  customer_name?: string;
  customer_email?: string;
  created_at?: string;
  total_price?: number | string;
  payment_method?: string;
  payment_status?: "paid" | "unpaid";
  shipping_status?: "pending" | "shipping" | "delivered";
  status?: string;
  shipping_address?: string;
  note?: string;
  items?: {
    id: string | number;
    product_id?: string | number;
    product_name?: string;
    size?: string;
    color?: string;
    sku?: string;
    image?: string | string[];
    quantity: number;
    price: number;
  }[];
  historyDetailOrder?: {
    status: string;
    message: string;
    createdAt: string;
    updatedBy?: {
      id?: string | number;
      name?: string;
      email?: string;
    };
  }[];
};

export type CreateOrderItemValues = {
  product_id: string | number;
  size?: string;
  color?: string;
  quantity: number | string;
};

export type CreateOrderValues = {
  customer_id: string | number;
  items: CreateOrderItemValues[];
  payment_method: string;
  shipping_address: string;
  note?: string;
};

export type CustomerType = {
  id?: number | string;
  fullname?: string;
  email?: string;
  address?: string;
  phone?: number | string;
  total_orders?: number | string;
  total_expend?: number | string;
};

export type CreateCustomerValues = {
  fullname: string;
  email: string;
  phone: string;
  address?: string;
};

export type ActiveLogType = {
  id?: number | string;
  user?: string;
  action?: string;
  module?: string;
  created_at?: string;
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

export type UpdateStatusValues = {
  id: string | number;
  status: string;
  historyDetailOrder?: {
    status: string;
    message: string;
    createdAt: string;
  }[];
  updatedBy?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
};
