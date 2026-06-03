import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "./mockApi";
import type { CategoryType } from "../types/domain";

export const GetCategory = () => {
  const [category, setCategory] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/category`);

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
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

export const CreateCategory = async (values: CategoryType) => {
  try {
    const res = await fetch(`${apiUrl}/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: Date.now(),
        name: values.name,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

type UpdateCategoryValues = Omit<CategoryType, "id" | "stock"> & {
  id: string | number;
};

export const UpdateCategory = async (values: UpdateCategoryValues) => {
  try {
    const res = await fetch(`${apiUrl}/category/${values.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: values.name,
      }),
    });

    const data = await res.json();
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
