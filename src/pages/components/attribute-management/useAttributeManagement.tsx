import  { useState, useEffect, useCallback } from "react";
import type { AttributeTitle, AttributeValueItem } from "../../../types/domain";
import openNotification from "../../../@crema/core/Notification";
import axiosClient from "../../../api/axiosClient";
import {
  DeleteAttributeTitle,
  UpdateAttribute,
  AddAttributeValue,
  SaveValueAttribute,
  DeleteValueAttribute,
} from "../../../api/attributeApi";
import { CreateActiveLog } from "../../../api/activeLogApi";

export type EditingModifier = {
  titleId: number;
  valueId: number;
  draft: number;
};

export type AddValueState = {
  open: boolean;
  titleId: number;
  titleName: string;
};

export const useAttributeManagement = (user: string = "") => {
  const [titles, setTitles] = useState<AttributeTitle[]>([]);
  const [valuePool, setValuePool] = useState<Record<number, AttributeValueItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddTitleOpen, setIsAddTitleOpen] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [editingModifier, setEditingModifier] = useState<EditingModifier | null>(null);
  const [editingTitle, setEditingTitle] = useState<AttributeTitle | null>(null);

  const [isSavingValue, setIsSavingValue] = useState(false);
  const [addValueState, setAddValueState] = useState<AddValueState>({
    open: false,
    titleId: 0,
    titleName: "",
  });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const dataPool = await axiosClient.get("/attribute/pool");

      setTitles(
        dataPool.map((item: any) => ({
          id: Number(item.id),
          name: item.name,
          attributeValues: item.attributeValues,
        }))
      );

      const pool: Record<number, AttributeValueItem[]> = {};
      dataPool.forEach((item: any) => {
        pool[Number(item.id)] = (item.attributeValues || []).map((val: any) => ({
          id: Number(val.id),
          value: val.value,
          price_modifier_amount: val.priceModifierAmount ?? val.price_modifier_amount ?? 0,
        }));
      });
      setValuePool(pool);
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể tải dữ liệu thuộc tính.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddTitle = async (name: string) => {
    setIsSavingTitle(true);
    try {
      await axiosClient.post("/attribute", { name });
      await CreateActiveLog({ module: "Attribute", action: `CREATE - ${name}`, user });
      openNotification("success", {
        message: "Thành công",
        description: `Đã thêm nhóm "${name}"`,
      });
      setIsAddTitleOpen(false);
      fetchAll();
      return true;
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể thêm nhóm thuộc tính.",
      });
      return false;
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteTitle = async (values: AttributeTitle) => {
    try {
      await DeleteAttributeTitle(values.id);
      await CreateActiveLog({ module: "Attribute", action: `DELETE - ${values.name}`, user });
      openNotification("success", {
        message: "Đã xóa",
        description: `Nhóm "${values.name}" đã bị xóa.`,
      });
      await fetchAll();
    } catch (error){
      openNotification("error", {
        message: "Lỗi",
        description: error,
      });
    }
  };

  const handleUpdate = async (id: number, name: string): Promise<boolean> => {
    setIsSavingTitle(true);
    try {
      await UpdateAttribute(id, name);
      await CreateActiveLog({ module: "Attribute", action: `UPDATE - ${name}`, user });
      openNotification("success", {
        message: "Cập nhật thành công",
        description: `Đã đổi tên nhóm thành "${name}".`,
      });
      await fetchAll();
      setEditingTitle(null);
      return true;
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể cập nhật nhóm thuộc tính.",
      });
      return false;
    } finally {
      setIsSavingTitle(false);
    }
  }

  const openAddValue = (titleId: number, titleName: string) => {
    setAddValueState({ open: true, titleId, titleName });
  };

  const closeAddValue = () => {
    setAddValueState((prev) => ({ ...prev, open: false }));
  };

  const handleAddValue = async (value: string, modifier: number) => {
    setIsSavingValue(true);
    try {
      await AddAttributeValue(addValueState.titleId, value, modifier ?? 0);
      await CreateActiveLog({ module: "Attribute", action: `CREATE value - ${value}`, user });
      openNotification("success", {
        message: "Thành công",
        description: `Đã thêm giá trị "${value}"`,
      });
      await fetchAll();
      closeAddValue();
      return true;
    } catch (err: any) {
      openNotification("error", {
        message: "Lỗi",
        description: err?.response?.data?.message || err?.message || "Không thể thêm giá trị.",
      });
      return false;
    } finally {
      setIsSavingValue(false);
    }
  };

  const handleSaveValueAttribute = async (valueId: number, priceModifierAmount: number) => {
    setIsSavingValue(true);
    try {
      await SaveValueAttribute(valueId, priceModifierAmount);
      await CreateActiveLog({ module: "Attribute", action: `UPDATE value modifier - ${valueId}`, user });
      openNotification("success", {
        message: "Thành công",
        description: "Đã cập nhật chênh lệch giá thành công.",
      });
      await fetchAll();
      setEditingModifier(null);
    } catch (error) {
      openNotification("error", {
        message: "Lỗi",
        description: error,
      });
    } finally {
      setIsSavingValue(false);
    }
  };

  const handleDeleteValueAttribute = async (id: number) => {
    setIsSavingValue(true);
    try {
      await DeleteValueAttribute(id);
      await CreateActiveLog({ module: "Attribute", action: `DELETE value - ${id}`, user });
      openNotification("success", {
        message: "Thành công",
        description: "Đã xóa thành công.",
      });
      await fetchAll();
    } catch (error: any) {
      openNotification("error", {
        message: "Lỗi",
        description: error?.response?.data?.message || error?.message || "Không thể xóa giá trị.",
      });
    } finally {
      setIsSavingValue(false);
    }
  }

  return {
    titles,
    valuePool,
    isLoading,
    isAddTitleOpen,
    setIsAddTitleOpen,
    isSavingTitle,
    isSavingValue,
    editingModifier,
    setEditingModifier,
    addValueState,
    openAddValue,
    closeAddValue,
    handleAddTitle,
    handleDeleteTitle,
    handleUpdate,
    handleAddValue,
    editingTitle,
    setEditingTitle,
    handleSaveValueAttribute,
    handleDeleteValueAttribute
  };
};
