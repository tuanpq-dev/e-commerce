import { useCallback, useEffect, useState } from "react";
import type { DataType, ProductInitialValues } from "../types/domain";
import { apiUrl } from "./mockApi";

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
    const res = await fetch(`${apiUrl}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        id: Date.now(),
        sku: `${values.sku} ${Date.now()}`,
        price: Number(values.price),
        stock: Number(values.stock),
        status: "pending",
        image:
          "https://img.magnific.com/free-vector/illustration-gallery-icon_53876-27002.jpg?semt=ais_hybrid&w=740&q=80",
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

type UpdateProductValues = Omit<ProductInitialValues, "id" | "stock"> & {
  id: string | number;
};

export const UpdateProduct = async ({ id, ...values }: UpdateProductValues) => {
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price: Number(values.price),
        image:
          "https://img.magnific.com/free-vector/illustration-gallery-icon_53876-27002.jpg?semt=ais_hybrid&w=740&q=80",
        name: values.name,
        category: values.category,
        description: values.description,
        status: "pending",
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

export const DeleteProduct = async (id: number | string) => {
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};
