// ═══════════════════════════════════════════════════════
//  THUỘC TÍNH ĐỘNG (N-attribute system)
// ═══════════════════════════════════════════════════════

/** Nhóm tên thuộc tính toàn hệ thống, lưu trong /attribute_titles */
export type AttributeTitle = {
  id: number;    // "title_size"
  name: string;  // "Size"
  attributeValues?: any
};

/** Một giá trị thuộc tính cụ thể kèm modifier giá */
export type AttributeValueItem = {
  id: number;                    // "v_m"
  value: string;                 // "M"
  price_modifier_amount: number; // ±VNĐ so với base_price
};

/** Một nhóm thuộc tính của sản phẩm (Size, Màu, ...) kèm danh sách giá trị */
export type AttributeGroup = {
  titleId: number;               // "title_size"
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
  comboKey: any;
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
  id: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  paymentMethod: "cod" | "banking" | string; ó
  paymentStatus: "paid" | "unpaid";
  shippingStatus: "pending" | "shipping" | "delivered" | string;
  status: "completed" | "processing" | string;
  shippingAddress: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  
  items?: {
    id: string | number;
    orderId?: string | number;
    productId: string | number;
    productName: string;
    size?: string;
    color?: string;
    sku?: string;
    image?: string | string[];
    quantity: number;
    price: number;
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
  user?: string;
  action?: string;
  module?: string;
  createdAt?: string;
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
