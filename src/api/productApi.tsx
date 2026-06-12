import { useCallback, useEffect, useState } from "react";
import type {
  DataType,
  ProductInitialValues,
  ProductVariant,
} from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";
import { IncreaseCategoryProductTotal } from "./categoryApi";

export const GetProduct = () => {
  const [product, setProduct] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callApiWithRetries({
        url: "/products",
      });

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

const createVariantSku = (
  productSku: ProductInitialValues["sku"],
  productName: ProductInitialValues["name"],
  variant: ProductVariant,
) =>
  [productSku, productName, variant.size, variant.color]
    .filter(Boolean)
    .map((item) => String(item).trim().replace(/\s+/g, "-").toUpperCase())
    .join("-");

const normalizeVariants = (values: ProductInitialValues) => {
  const variants = values.variants ?? [];

  return variants
    .filter((variant) => variant.size || variant.color)
    .map((variant) => ({
      ...variant,
      id: variant.id ?? crypto.randomUUID(),
      price: Number(variant.price),
      stock: Number(variant.stock),
      sku: variant.sku || createVariantSku(values.sku, values.name, variant),
    }));
};

const getProductSummary = (values: ProductInitialValues) => {
  const variants = normalizeVariants(values);

  if (!variants.length) {
    return {
      price: Number(values.price),
      stock: Number(values.stock),
      variants,
    };
  }

  return {
    price: Math.min(...variants.map((variant) => Number(variant.price))),
    stock: variants.reduce(
      (total, variant) => total + Number(variant.stock),
      0,
    ),
    variants,
  };
};

export const CreateProduct = async (values: ProductInitialValues) => {
  try {
    const productSummary = getProductSummary(values);

    const payload = {
      ...values,
      id: Date.now(),
      sku: `${values.sku} ${Date.now()}`,
      price: productSummary.price,
      stock: productSummary.stock,
      variants: productSummary.variants,
      status: "pending",
      category_child: values?.category_child || [],
      created_at: Date.now(),
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

type UpdateProductValues = Omit<ProductInitialValues, "id"> & {
  id: string | number;
};

export const UpdateProduct = async ({ id, ...values }: UpdateProductValues) => {
  try {
    const productSummary = getProductSummary(values);

    const payload = {
      price: productSummary.price,
      stock: productSummary.stock,
      variants: productSummary.variants,
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
