// hooks/useDashboard.ts
import { useEffect, useState } from "react";
import {
  GetOrders,
  getOrdersByDayOfMonth,
  getTotalRevenueFromOrders,
} from "../../../../api/orderApi";
import { GetProducts } from "../../../../api/productApi";

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

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
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
        const { items: totalProducts } = await GetProducts();

        const results = months.map(({ month, year }) =>
          getTotalRevenueFromOrders(orders, { month, year }),
        );
        setRevenueData(results);
        setOrdersByDayOfMonth(getOrdersByDayOfMonth(orders));

        const uniqueCustomers = new Set(orders.map((o) => o.customer_id)).size;
        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce(
            (acc, o) => acc + Number(o.total_price ?? 0),
            0,
          ),
          totalCustomers: uniqueCustomers,
          totalProducts,
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
