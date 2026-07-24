import type { AttributeTitle, AttributeValueItem } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";
export const GetAttributeTitles = async (): Promise<AttributeTitle[]> => {
  return callApiWithRetries<AttributeTitle[]>({ url: "/attribute/pool" });
};

export const DeleteAttributeTitle = async (id: string | number): Promise<void> => {
  await axiosClient.delete(`/attribute/${id}`);
};

export const UpdateAttribute = async (id: string | number, name: string) => {
  await axiosClient.patch(`/attribute/${id}`, { name })
}

export const AddAttributeValue = async (
  titleId: string | number,
  value: string,
  priceModifierAmount = 0,
): Promise<AttributeValueItem> => {
  const res = await axiosClient.post("/attribute/value", {
    attributeTitleId: Number(titleId),
    name: value.trim(),
    priceModifierAmount: Number(priceModifierAmount) || 0,
  });
  return res.data;
};

export const DeleteAttributeValue = async (
  valueId: string | number,
): Promise<void> => {
  await axiosClient.delete(`/attribute/${valueId}`);
};

export const SaveValueAttribute = async (id: string | number, priceModifierAmount: number) => {
  await axiosClient.patch(`/attribute/value/${id}`, {
    priceModifierAmount: Number(priceModifierAmount) || 0,
  });
};

export const DeleteValueAttribute = async (id: string | number) => {
  await axiosClient.delete(`/attribute/value/${id}`)
}
