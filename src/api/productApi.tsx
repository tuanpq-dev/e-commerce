import { useCallback, useEffect, useState } from "react";
import type { DataType, ProductInitialValues } from "../types/domain";
import { apiUrl } from "./mockApi";
import axiosClient from "./axiosClient";
import { IncreaseCategoryProductTotal } from "./categoryApi";

export const GetProduct = () => {
  const [product, setProduct] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/products`);

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();

      setProduct([...data].reverse());
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, isLoading, refetch: fetchProduct };
};

export const CreateProduct = async (values: ProductInitialValues) => {
  try {
    const payload = {
      ...values,
      id: Date.now(),
      sku: `${values.sku} ${Date.now()}`,
      price: Number(values.price),
      stock: Number(values.stock),
      status: "pending",
      image:
        "https://img.magnific.com/free-vector/illustration-gallery-icon_53876-27002.jpg?semt=ais_hybrid&w=740&q=80",
      category_child: values?.category_child || [],
    };

    const [res] = await Promise.all([
      axiosClient.post("/products", payload),
      IncreaseCategoryProductTotal({
        category: values.category,
        category_child: values.category_child,
      }),
    ]);

    return res.data;
  } catch (err) {
    console.log(err);
  }
};

type UpdateProductValues = Omit<ProductInitialValues, "id" | "stock"> & {
  id: string | number;
};

export const UpdateProduct = async ({ id, ...values }: UpdateProductValues) => {
  try {
    const payload = {
      price: Number(values.price),
      image:
        "https://img.magnific.com/free-vector/illustration-gallery-icon_53876-27002.jpg?semt=ais_hybrid&w=740&q=80",
      name: values.name,
      category: values.category,
      category_child: values.category_child || [],
      description: values.description,
      status: "pending",
    };

    const res = await axiosClient.patch(`/products/${id}`, payload);

    const data = await res.data;
    return data;
  } catch (err) {
    console.log(err);
  }
};

export const DeleteProduct = async (id: number | string) => {
  try {
    const res = await axiosClient.delete(`/products/${id}`);

    const data = await res.data;
    return data;
  } catch (err) {
    console.log(err);
  }
};
