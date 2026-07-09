// ═══════════════════════════════════════════════════════
//  THUỘC TÍNH ĐỘNG (N-attribute system)
// ═══════════════════════════════════════════════════════

/** Nhóm tên thuộc tính toàn hệ thống, lưu trong /attribute_titles */
export type AttributeTitle = {
  id: string;    // "title_size"
  name: string;  // "Size"
};

/** Một giá trị thuộc tính cụ thể kèm modifier giá */
export type AttributeValueItem = {
  id: string;                    // "v_m"
  value: string;                 // "M"
  price_modifier_amount: number; // ±VNĐ so với base_price
};

/** Một nhóm thuộc tính của sản phẩm (Size, Màu, ...) kèm danh sách giá trị */
export type AttributeGroup = {
  titleId: string;               // "title_size"
  name: string;                  // "Size"
  values: AttributeValueItem[];
};

/**
 * Map lưu trữ chi tiết nhóm thuộc tính của từng sản phẩm.
 * Key = titleId, Value = { name, values[] }
 * Lưu tại endpoint /product_attributes_details
 */
export type ProductAttributesDetails = Record<
  string,
  { name: string; values: AttributeValueItem[] }
>;

/**
 * Map lưu stock theo combination key.
 * Key = sort(value_ids).join("-"),  ví dụ "v_m-v_red"
 * Lưu tại endpoint /product_variants
 */
export type VariantCombinationMap = Record<string, { stock: number }>;

// ═══════════════════════════════════════════════════════
//  VARIANT CŨ (giữ lại để backward-compat với code API cũ)
// ═══════════════════════════════════════════════════════


export type ProductVariant = {
  id?: string | number;
  product_id?: string;
  size: string;
  color: string;
  price: number | string;
  stock: number | string;
  sku?: string;
};

/** Map dạng Record — dùng khi group variants theo product_id ở phía client */
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
  /** [MỚI] ID các nhóm thuộc tính sản phẩm này dùng, ví dụ ["title_size", "title_color"] */
  attribute_title_ids?: string[];
  /** [MỚI] Chi tiết nhóm thuộc tính đã được merge vào product khi fetch */
  attributesDetails?: AttributeGroup[];
  /** [MỚI] Map stock theo combination key, đã được merge vào product khi fetch */
  variant_map?: VariantCombinationMap;
  /** [LEGACY] selectedSizes — giữ để backward compat */
  selectedSizes?: string[];
  /** [LEGACY] selectedColors — giữ để backward compat */
  selectedColors?: string[];
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
  basePrice?: number | string;
  /** [MỚI] Danh sách nhóm thuộc tính động */
  attribute_groups?: AttributeGroup[];
  /** [MỚI] Map stock theo combination key */
  variant_map?: VariantCombinationMap;
  /** [LEGACY] */
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
  id?: number | string;
  order_code?: number | string;
  orderCode?: number | string;
  customer_id?: number | string;
  customerId?: number | string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  customer_phone?: string | number;
  customerPhone?: string | number;
  created_at?: string;
  createdAt?: string;
  total_price?: number | string;
  totalPrice?: number | string;
  payment_method?: string;
  paymentMethod?: string;
  payment_status?: "paid" | "unpaid";
  paymentStatus?: "paid" | "unpaid";
  shipping_status?: "pending" | "shipping" | "delivered";
  shippingStatus?: "pending" | "shipping" | "delivered";
  status?: string;
  shipping_address?: string;
  shippingAddress?: string;
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
  attributes?: Record<string, string>;
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
  created_at?: number | string;
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

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
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
