import type { TFunction } from "i18next";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

export const ORDER_STATUS_KEYS = [
  "pending",
  "processing",
  "shipping",
  "completed",
  "cancelled",
] as const;

export type OrderStatusKey = (typeof ORDER_STATUS_KEYS)[number];

/**
 * Inline style config cho StatusBadge trong detail-order.
 * Dùng màu hex thay vì Ant Design tag color.
 */
export const ORDER_STATUS_STYLE: Record<
  OrderStatusKey,
  { colorHex: string; bg: string }
> = {
  pending: { colorHex: "#d46b08", bg: "#fff7e6" },
  processing: { colorHex: "#096dd9", bg: "#e6f4ff" },
  shipping: { colorHex: "#7c3aed", bg: "#f5f3ff" },
  completed: { colorHex: "#389e0d", bg: "#f6ffed" },
  cancelled: { colorHex: "#cf1322", bg: "#fff1f0" },
};

/**
 * Trả về danh sách trạng thái đơn hàng với label đã i18n.
 * Dùng trong Table Tag render và status select option.
 */
export const getOrderStatuses = (t: TFunction) => [
  {
    status: "completed" as const,
    icon: <CheckCircleOutlined />,
    title: t("order.status.completed"),
    color: "green",
  },
  {
    status: "processing" as const,
    icon: <ClockCircleOutlined />,
    title: t("order.status.processing"),
    color: "yellow",
  },
  {
    status: "cancelled" as const,
    icon: <CloseCircleOutlined />,
    title: t("order.status.cancelled"),
    color: "red",
  },
  {
    status: "pending" as const,
    icon: <CloseCircleOutlined />,
    title: t("order.status.pending"),
    color: "gray",
  },
  {
    status: "shipping" as const,
    icon: <ClockCircleOutlined />,
    title: t("order.status.shipping"),
    color: "blue",
  },
];
