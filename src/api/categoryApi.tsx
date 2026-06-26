import type { CategoryType } from "../types/domain";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export type PaginatedCategories = {
  data: CategoryType[];
  items: number;
};

export const GetCategories = async (
  page?: number,
  limit?: number,
  search?: string,
): Promise<PaginatedCategories> => {
  const params: Record<string, string | number> = {
    _sort: "created_at",
    _order: "desc",
  };

  if (page !== undefined) {
    params._page = page;
  }
  if (limit !== undefined) {
    params._limit = limit;
  }
  if (search && search.trim()) {
    params.q = search.trim();
  }

  // Dùng axiosClient trực tiếp để đọc header X-Total-Count (json-server v0.17)
  const response = await axiosClient.get<CategoryType[]>("/category", { params }) as AxiosResponse<CategoryType[]>;

  const data: CategoryType[] = response.data ?? [];
  const items: number = Number(response.headers["x-total-count"]) || data.length;

  return { data, items };
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
  const payload = {
    name: values.name,
    total_child: 0,
  };

  const res = await axiosClient.patch(`/category/${values.id}`, payload);
  return res.data;
};

// Nhóm 3 + 4: Bỏ try/catch, dùng axiosClient thay vì fetch
export const DeleteCategory = async (id: number | string) => {
  const res = await axiosClient.delete(`/category/${id}`);
  return res.data;
};

type CreateCategoryChildValues = Pick<CategoryType, "name" | "id">;
type UpdateCategoryChildValues = Pick<CategoryType, "name">;

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

// eslint-disable-next-line react-refresh/only-export-components
export const updateCategoryChild = async (
  parentId: number | string,
  childId: number | string,
  values: UpdateCategoryChildValues,
) => {
  const dataParent = await callApiWithRetries({
    url: `/category/${parentId}`,
  });

  const child = (dataParent.child ?? []).map((categoryChild: CategoryType) => {
    if (String(categoryChild.id) !== String(childId)) {
      return categoryChild;
    }

    return {
      ...categoryChild,
      name: values.name,
    };
  });

  const res = await axiosClient.patch(`/category/${parentId}`, {
    child,
  });

  return res.data;
};
