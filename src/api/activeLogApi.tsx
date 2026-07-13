import type { ActiveLogType } from "../types/domain";
import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";

export type PaginatedActiveLogs = {
  data: ActiveLogType[];
  items: number;
};

export const GetActiveLogs = async (
  page = 1,
  pageSize = 10,
): Promise<PaginatedActiveLogs> => {
  // json-server v0.17: dùng _sort + _order thay vì prefix "-", _limit thay vì _per_page
  const params: Record<string, string | number> = {
    _page: page,
    _limit: pageSize,
    _sort: "created_at",
    _order: "desc",
  };

  const response = await axiosClient.get<ActiveLogType[]>("/active_logs", { params }) as AxiosResponse<ActiveLogType[]>;

  const data: ActiveLogType[] = response.data ?? [];
  const items: number = Number(response.headers["x-total-count"]) || data.length;

  return { data, items };
};

export const CreateActiveLog = async (values: ActiveLogType) => {
  const payload = {
    module: values.module,
    action: values.action,
    user: values.user ?? "Unknown",
    // created_at: new Date().toISOString(),
  };

  const res = await axiosClient.post("/active-log", payload);
  return res.data;
};
