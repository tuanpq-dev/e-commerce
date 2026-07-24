import type { ActiveLogType } from "../types/domain";
import axiosClient from "./axiosClient";

export const CreateActiveLog = async (values: ActiveLogType) => {
  const payload = {
    module: values.module,
    action: values.action,
    userId:
      values.userId !== undefined && !isNaN(Number(values.userId))
        ? Number(values.userId)
        : undefined,
    userName:
      values.userName ||
      (typeof values.user === "string" ? values.user : undefined),
    userRole: values.userRole,
    payload: values.payload,
  };

  const res = await axiosClient.post("/active-log", payload);
  return res.data;
};
