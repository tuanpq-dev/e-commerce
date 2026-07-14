import type { ActiveLogType } from "../types/domain";
import axiosClient from "./axiosClient";
export const CreateActiveLog = async (values: ActiveLogType) => {
  const payload = {
    module: values.module,
    action: values.action,
    user: values.user ?? "Unknown",
  };

  const res = await axiosClient.post("/active-log", payload);
  return res.data;
};
