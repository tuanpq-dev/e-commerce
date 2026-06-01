import type { DataType } from "../types/domain";

export const products: DataType[] = [
  {
    image: "src/mock-data/images/dowload.png",
    sku: "a1",
    name: "John Brown",
    category: "Áo",
    price: 1000,
    stock: 20,
    status: "pending",
  },
  {
    image: "src/mock-data/images/dowload.png",
    sku: "a2",
    name: "John Brown 1",
    category: "Quần",
    price: 700,
    stock: 15,
    status: "active",
  },
  {
    image: "src/mock-data/images/dowload.png",
    sku: "a3",
    name: "John Brown 2",
    category: "Mũ",
    price: 200,
    stock: 30,
    status: "active",
  },
];
