export interface DataType {
  image: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
}

export type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
};
