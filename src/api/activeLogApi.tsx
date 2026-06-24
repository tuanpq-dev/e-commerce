import type { ActiveLogType } from "../types/domain";
import axiosClient from "./axiosClient";
import callApiWithRetries from "./callApiWithRetries";

export const GetActiveLogs = async (page = 1, pageSize = 10) => {
  const res = await callApiWithRetries<any>({
    url: "/active_logs",
    config: {
      params: {
        _page: page,
        _per_page: pageSize,
        _sort: "-created_at",
      },
    },
  });
  return res;
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
