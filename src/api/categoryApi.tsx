import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "./mockApi";
import type { CategoryType } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export const GetCategory = () => {
  const [category, setCategory] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callApiWithRetries({
        url: "/category",
      });
      setCategory(data);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return { category, isLoading, refetch: fetchCategory };
};

export const GetCategoryById = async (id: number | string) => {
  return callApiWithRetries({
    url: `/category/${id}`,
  });
};

export const CreateCategory = async (values: CategoryType) => {
  const res = await axiosClient.post(`/category`, {
    name: values.name,
    total: 0,
    child: [],
  });
  return res.data;
};

type UpdateCategoryValues = Omit<CategoryType, "id" | "stock"> & {
  id: string | number;
};

export const UpdateCategory = async (values: UpdateCategoryValues) => {
  try {
    const payload = {
      name: values.name,
      total_child: 0,
    };

    const res = await axiosClient.patch(`/category/${values.id}`, payload);
    const data = res.data;

    return data;
  } catch (err) {
    console.log(err);
  }
};

export const DeleteCategory = async (id: number | string) => {
  try {
    const res = await fetch(`${apiUrl}/category/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    return data;
  } catch (err) {
    console.log(err);
  }
};

type CreateCategoryChildValues = Pick<CategoryType, "name" | "id">;

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

export const CreateCategoryChild = async (
  values: CreateCategoryChildValues,
) => {
  const { id: parentId, name } = values;

  const dataParent = await callApiWithRetries({
    url: `/category/${parentId}`,
  });

  const res = await axiosClient.put(`/category/${parentId}`, {
    ...dataParent,
    child: [
      ...(dataParent.child ?? []),
      { id: crypto.randomUUID(), name, parentId, total: 0 },
    ],
  });

  return res.data;
};

// export const UpdateCategoryChild = (id: number | string) => {

// }
