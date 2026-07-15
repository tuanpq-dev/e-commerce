import type { AttributeTitle, AttributeValueItem } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";
export const GetAttributeTitles = async (): Promise<AttributeTitle[]> => {
  return callApiWithRetries<AttributeTitle[]>({ url: "/attribute/pool" });
};

export const DeleteAttributeTitle = async (id: number): Promise<void> => {
  await axiosClient.delete(`/attribute/${id}`);
};

export const UpdateAttribute = async (id: number, name: string) => {
  await axiosClient.patch(`/attribute/${id}`, { name })
}

export const AddAttributeValue = async (
  titleId: number,
  value: string,
  priceModifierAmount = 0,
): Promise<AttributeValueItem> => {
  const res = await axiosClient.post("/attribute/value", {
    attributeTitleId: titleId,
    name: value.trim(),
    priceModifierAmount,
  });
  return res.data;
};

export const DeleteAttributeValue = async (
  valueId: number,
): Promise<void> => {
  await axiosClient.delete(`/attribute/${valueId}`);
};

export const SaveValueAttribute = async (id: number, priceModifierAmount: number) => {
  await axiosClient.patch(`/attribute/value/${id}`, { priceModifierAmount })
}

export const DeleteValueAttribute = async (id: number) => {
  await axiosClient.delete(`/attribute/value/${id}`)
}

