import type { CategoryType } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export const GetCategoryById = async (id: number | string) => {
  return callApiWithRetries({
    url: `/category/${id}`,
  });
};

export const CreateCategory = async (values: CategoryType) => {
  const res = await axiosClient.post(`/category`, {
    name: values.name,
    parentId: values.parentId,
    total: 0,
    child: [],
  });
  return res.data;
};

type UpdateCategoryValues = Omit<CategoryType, "id" | "stock"> & {
  id: string | number;
};

export const UpdateCategory = async (values: UpdateCategoryValues) => {
  const payload = {
    name: values.name,
  };

  const res = await axiosClient.patch(`/category/${values.id}`, payload);
  return res.data;
};

// Nhóm 3 + 4: Bỏ try/catch, dùng axiosClient thay vì fetch
export const DeleteCategory = async (id: number | string) => {
  const res = await axiosClient.delete(`/category/${id}`);
  return res.data;
};

const getCategoryId = (
  category?: string | number | CategoryType,
): string | number | undefined => {
  if (!category) {
    return undefined;
  }

  if (typeof category === "object") {
    return category.id;
  }

  return category;
};

export const IncreaseCategoryProductTotal = async (values: {
  category?: string | number | CategoryType;
  category_child?: (string | number | CategoryType)[];
}) => {
  const parentId = getCategoryId(values.category);

  if (!parentId) {
    return;
  }

  const childIds = new Set(
    (values.category_child ?? [])
      .map((categoryChild) => getCategoryId(categoryChild))
      .filter((id): id is string | number => id !== undefined),
  );

  const dataParent = await callApiWithRetries({
    url: `/category/${parentId}`,
  });
  const child = (dataParent.child ?? []).map((categoryChild: CategoryType) => {
    if (!categoryChild.id || !childIds.has(categoryChild.id)) {
      return categoryChild;
    }

    return {
      ...categoryChild,
      total: Number(categoryChild.total ?? 0) + 1,
    };
  });

  const res = await axiosClient.patch(`/category/${parentId}`, {
    total: Number(dataParent.total ?? 0) + 1,
    child,
  });

  return res.data;
};
