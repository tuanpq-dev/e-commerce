export type AttributeTitle = {
  id: string | number;    // "title_size"
  name: string;  // "Size"
  attributeValues?: any
};

export type AttributeValueItem = {
  id: string | number;                    // "v_m"
  value: string;                 // "M"
  price_modifier_amount: number; // ±VNĐ so với base_price
};

export type AttributeGroup = {
  titleId: string | number;               // "title_size"
  name: string;                  // "Size"
  values: AttributeValueItem[];
};

export type ProductAttributesDetails = Record<
  string,
  { name: string; values: AttributeValueItem[] }
>;

export type VariantCombinationMap = Record<
  string,
  { stock: number; isDeleted?: boolean; deleted?: boolean }
>;

export type ProductVariant = {
  id?: string | number;
  product_id?: string;
  size?: string;
  color?: string;
  price?: number | string;
  stock?: number | string;
  sku?: string;
  comboKey?: any;
  attributes?: any;
};

export type ProductVariantsMap = Record<string, ProductVariant[]>;

export interface DataType {
  id?: string | number;
  image: string | string[];
  sku: string;
  name: string;
  category: string | CategoryType;
  category_child?: (string | number | CategoryType)[];
  price: number;
  stock: number;
  basePrice?: number;
  attribute_title_ids?: string[];
  attributesDetails?: AttributeGroup[];
  variant_map?: VariantCombinationMap;
  selectedSizes?: string[];
  selectedColors?: string[];
  status?: string;
  description?: string;
  variants?: ProductVariant[];
  createdAt?: string | number;
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
  basePrice?: number | string;
  attribute_groups?: AttributeGroup[];
  variant_map?: VariantCombinationMap;
  selectedSizes?: string[];
  selectedColors?: string[];
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
  children?: CategoryType[];
  category_child?: number;
  total_prod?: number | string;
};

export type OrderType = {
  id: number | string;
  orderCode: string;
  customerId: number | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    id?: number | string;
    fullname?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  totalPrice?: number | string;
  paymentMethod: "cod" | "banking" | string;
  paymentStatus: "paid" | "unpaid" | string;
  shippingStatus: "pending" | "shipping" | "delivered" | string;
  status: "completed" | "processing" | string;
  shippingAddress?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;

  items?: {
    id: string | number;
    orderId?: string | number;
    productId?: string | number;
    productName: string;
    size?: string;
    color?: string;
    sku?: string;
    image?: string | string[];
    quantity: number;
    price: number | string;
  }[];
  historyDetailOrder?: {
    id?: string | number;
    orderId?: string | number;
    status: string;
    message: string;
    createdAt: string;
    updateBy?: string;
  }[];
};

export type CustomerOrderResponseType = {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalExpend: number;
  createdAt: string;
  orders: OrderType[];
};

export type CreateOrderItemValues = {
  productId: string | number;
  size?: string;
  color?: string;
  quantity: number | string;
  attributes?: Record<string, string>;
  variantId?: number | string;
};

export type CreateOrderValues = {
  customerId: string | number;
  items: CreateOrderItemValues[];
  paymentMethod: string;
  shippingAddress: string;
  note?: string;
};

export type CustomerType = {
  id?: number | string;
  customerName?: string;
  fullname?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: number | string;
  total_orders?: number | string;
  totalPrice?: number | string;
  created_at?: number | string;
  items?: any;
  email?: string;
  address?: string;
  phone?: number | string;
  totalOrders?: number | string;
  totalExpend?: number | string;
};

export type CreateCustomerValues = {
  fullname: string;
  email: string;
  phone: string;
  address?: string;
};

export type ActiveLogType = {
  id?: number | string;
  userId?: number;
  userName?: string;
  userRole?: string;
  action?: string;
  module?: string;
  payload?: any;
  user?: any;
  createdAt?: string;
};

export type UpdateUserPayload = {
  name?: string;
  phone?: string;
  username?: string;
  email?: string;
  avatar?: string;
  image?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

export type UpdateStatusValues = {
  // id: string | number;
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
