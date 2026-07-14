// hooks/useDashboard.ts
import { useEffect, useState } from "react";
import { GetOrders } from "../../../../api/orderApi";
import axiosClient from "../../../../api/axiosClient";
import type { OrderType } from "../../../../types/domain";

const getLast6Months = () => {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("en-US", { month: "short" }),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }

  return months;
};

const getTotalRevenueFromOrders = (
  orders: OrderType[],
  params?: {
    month?: number;
    year?: number;
  },
) => {
  const filtered =
    params?.month && params?.year
      ? orders.filter((item) => {
          if (!item.createdAt) {
            return false;
          }
          const date = new Date(item.createdAt);
          return (
            date.getMonth() + 1 === params.month &&
            date.getFullYear() === params.year
          );
        })
      : orders;

  return filtered.reduce((acc, item) => acc + Number(item.totalPrice ?? 0), 0);
};

const getOrdersByDayOfMonth = (
  orders: OrderType[],
): { labels: string[]; data: number[] } => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const labels = Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1),
  );
  const data = Array.from({ length: daysInMonth }, () => 0);

  orders.forEach((order) => {
    if (!order.createdAt) {
      return;
    }

    const date = new Date(order.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (year === currentYear && month === currentMonth && day) {
      data[day - 1] += 1;
    }
  });

  return { labels, data };
};

type Stats = {
  totalOrders?: number;
  totalRevenue?: number;
  totalCustomers?: number;
  totalProducts?: number;
};

export const useDashboard = () => {
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [ordersByDayOfMonth, setOrdersByDayOfMonth] = useState<{
    labels: string[];
    data: number[];
  }>({
    labels: [],
    data: [],
  });
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(false);
  const months = getLast6Months();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: orders } = (await GetOrders()) ?? { data: [], items: 0 };
        const { data: totalProducts } = await axiosClient.post('/product/search');

        const results = months.map(({ month, year }) =>
          getTotalRevenueFromOrders(orders, { month, year }),
        );
        setRevenueData(results);
        setOrdersByDayOfMonth(getOrdersByDayOfMonth(orders));

        const uniqueCustomers = new Set(orders.map((o) => o.customerId).filter(Boolean)).size;
        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce(
            (acc, o) => acc + Number(o.totalPrice ?? 0),
            0,
          ),
          totalCustomers: uniqueCustomers,
          totalProducts: totalProducts.length,
        });
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return {
    revenueData,
    ordersByDayOfMonth,
    stats,
    loading,
    months,
  };
};
