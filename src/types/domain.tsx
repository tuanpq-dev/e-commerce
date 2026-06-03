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
  username?: string;
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
  name: string;
  total: number | string;
};
