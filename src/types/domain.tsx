export interface DataType {
  id?: string | number;
  image: string | string[];
  sku: string;
  name: string;
  category: string | CategoryType;
  category_child?: CategoryType[];
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
  category?: string | number | CategoryType;
  category_child?: (string | number | CategoryType)[];
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
  status?: string;
};

export type CustomerType = {
  id?: number | string;
  fullname?: string;
  email?: string;
  phone?: number | string;
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
