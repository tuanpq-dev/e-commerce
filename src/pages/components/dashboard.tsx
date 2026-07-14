// Dashboard.tsx
import { Card, Col, Row, Spin } from "antd";
import ReactECharts from "echarts-for-react";
import formatCurrency from "../../utils/formatCurrecy";
import { useDashboard } from "../../@crema/core/hook/useDashboard";
import { useTranslation } from "react-i18next";

type ChartProps = {
  title: string;
  type: "bar" | "line";
  labels?: string[];
  data?: number[];
};

const Chart = ({ title, type, labels, data }: ChartProps) => {
  const option = {
    title: { text: title, left: "center" },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        if (title.includes("Doanh thu")) {
          return `${item.name}: ${formatCurrency(item.value)}`;
        }
        return `${item.name}: ${item.value}`;
      },
    },
    grid: { top: 60, left: 60, right: 30, bottom: 50 },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        interval: 0,
        // rotate: labels.length > 12 ? 45 : 0,
      },
    },
    yAxis: {
      type: "value",
      minInterval: title.includes("Doanh thu") ? undefined : 1,
      axisLabel: {
        formatter: (value: number) => {
          if (title.includes("Doanh thu")) return `${value / 1000000}tr`;
          return Number.isInteger(value) ? value : "";
        },
      },
    },
    series: [{ name: title, type, data, smooth: type === "line" }],
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ width: "100%", height: 350 }}
    />
  );
};

type StatCardProps = {
  title: string;
  value: number;
  isCurrency?: boolean;
};

const StatCard = ({ title, value, isCurrency }: StatCardProps) => (
  <Card title={title}>
    <h2 style={{ margin: 0 }}>
      {isCurrency ? formatCurrency(value) : value.toLocaleString("vi-VN")}
    </h2>
  </Card>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { revenueData, ordersByDayOfMonth, stats, loading, months } =
    useDashboard();

  const statisticCards = [
    { title: t("dashboard.stats.totalOrders"), value: stats.totalOrders },
    {
      title: t("dashboard.stats.totalRevenue"),
      value: stats.totalRevenue,
      isCurrency: true,
    },
    { title: t("dashboard.stats.totalCustomers"), value: stats.totalCustomers },
    { title: t("dashboard.stats.totalProducts"), value: stats.totalProducts },
  ];

  const revenueByMonth = {
    labels: months.map((m) => m.label),
    data: revenueData,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {statisticCards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <StatCard {...item} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card>
            <Chart
              title={t("dashboard.chart.revenueByMonth")}
              type="line"
              labels={revenueByMonth.labels}
              data={revenueByMonth.data}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <Chart
              title={`${t("dashboard.chart.ordersByDay")} ${
                new Date().getMonth() + 1
              }`}
              type="line"
              labels={ordersByDayOfMonth.labels}
              data={ordersByDayOfMonth.data}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
