import type {
  DataType,
  ProductInitialValues,
  VariantCombinationMap,
} from "../types/domain";
import axiosClient from "./axiosClient";
import {
  generateUniqueParentSku,
} from "../utils/skuGenerator";

import { calculateFinalPrice } from "../utils/variantEngine";
export type PaginatedProducts = {
  data: DataType[];
  items: number;
};


export const handleSubmitProduct = async (values: ProductInitialValues) => {
  const parentSku = values.sku || generateUniqueParentSku("SP");

  const variantMap: VariantCombinationMap = values.variant_map ?? {};
    const stock = Object.values(variantMap).reduce((sum, v) => sum + (v.stock ?? 0), 0);
    const price = Number(values.basePrice) || 0;
    const attributesDetails: Record<string, any> = {};
    for (const group of values.attribute_groups!) {
      attributesDetails[group.titleId] = {
        name: group.name,
        values: group.values.map(val => ({
          id: String(val.id),
          value: val.value,
          price_modifier_amount: val.price_modifier_amount
        }))
      };
    }

    const variantsArray = Object.entries(variantMap).map(([comboKey, info]) => ({
      comboKey,
      stock: Number(info.stock),
      price: calculateFinalPrice(
        price,
        values.attribute_groups!,
        comboKey.split("-")
      )
    }));

    let finalCategoryId = typeof values.category === "object" && values.category !== null
      ? Number((values.category as any).id)
      : Number(values.category);

    if (values.category_child && values.category_child.length > 0) {
      const firstChild = values.category_child[0];
      finalCategoryId = Number(typeof firstChild === "object" ? (firstChild as any).id : firstChild);
    }

    const createProductDto: any = {
      sku: parentSku,
      name: values.name,
      price,
      basePrice: price,
      stock,
      description: values.description || "",
      attributesDetails,
      variants: variantsArray
    };

    if (!isNaN(finalCategoryId)) {
      createProductDto.categoryId = finalCategoryId;
    }

    const res = await axiosClient.post("/product", createProductDto);
    return res;
};

export const CreateProduct = handleSubmitProduct;

type UpdateProductValues = Omit<ProductInitialValues, "id"> & {
  id: string | number;
};

export const UpdateProduct = async ({ id, ...values }: UpdateProductValues) => {
  let price = Number(values.price) || 0;
  let stock = Number(values.stock) || 0;
  let variantsArray: any[] = [];
  let attributesDetails: any = {};

  const variantMap: VariantCombinationMap = values.variant_map ?? {};
    stock = Object.values(variantMap).reduce((sum, v) => sum + (v.stock ?? 0), 0);
    price = Number(values.basePrice) || 0;

    // Convert attribute_groups to attributesDetails
    for (const group of values.attribute_groups!) {
      attributesDetails[group.titleId] = {
        name: group.name,
        values: group.values.map(val => ({
          id: String(val.id),
          value: val.value,
          price_modifier_amount: val.price_modifier_amount
        }))
      };
    }

    // Map variants to flat array expected by BE
    variantsArray = Object.entries(variantMap).map(([comboKey, info]) => ({
      comboKey,
      stock: Number(info.stock),
      price: calculateFinalPrice(
        price,
        values.attribute_groups!,
        comboKey.split("-")
      )
    }));

  let finalCategoryId = typeof values.category === "object" && values.category !== null
    ? Number((values.category as any).id)
    : Number(values.category);

  if (values.category_child && values.category_child.length > 0) {
    const firstChild = values.category_child[0];
    finalCategoryId = Number(typeof firstChild === "object" ? (firstChild as any).id : firstChild);
  }

  const updateProductDto: any = {
    name: values.name,
    price,
    basePrice: Number(values.basePrice) || price,
    stock,
    description: values.description || "",
    attributesDetails,
    variants: variantsArray,
  };

  if (!isNaN(finalCategoryId)) {
    updateProductDto.categoryId = finalCategoryId;
  }

  const res = await axiosClient.patch(`/product/${id}`, updateProductDto);
  return res;
};

export const UpdateStatusProduct = async (
  status: string,
  id: number | string,
) => {
  const payload = { status };
  const res = await axiosClient.patch(`/product/${id}`, payload);
  return res;
};
