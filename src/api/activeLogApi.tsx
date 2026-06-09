import type { ActiveLogType } from "../types/domain";
import axiosClient from "./axiosClient";

export const GetActiveLogs = async () => {
  try {
    const res = await axiosClient.get("/active_logs");

    return [...res.data].sort((current, next) => {
      return (
        new Date(next.created_at).getTime() -
        new Date(current.created_at).getTime()
      );
    });
  } catch (err) {
    console.log(err);
  }
};

export const CreateActiveLog = async (values: ActiveLogType) => {
  const payload = {
    module: values.module,
    action: values.action,
    user: values.user ?? "Unknown",
    created_at: new Date().toISOString(),
  };

  const res = await axiosClient.post("/active_logs", payload);

  return res.data;
};
