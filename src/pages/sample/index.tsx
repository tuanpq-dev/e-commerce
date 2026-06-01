import React from "react";
import config from "../../config";

// eslint-disable-next-line react-refresh/only-export-components
const Dashboard = React.lazy(() => import("../components/dashboard"));
const Product = React.lazy(() => import("../components/product"));
const Category = React.lazy(() => import("../components/category"));
const Order = React.lazy(() => import("../components/order"));
const Customer = React.lazy(() => import("../components/customer"));

export const samplePageConfig = [
  {
    path: config.routes.DASHBOARD,
    element: <Dashboard />,
    label: "Dashboard",
  },
  {
    path: config.routes.PRODUCT_MANAGEMENT,
    element: <Product />,
    label: "Product",
  },
  {
    path: config.routes.CATEGORY_MANAGEMENT,
    element: <Category />,
    label: "Category",
  },
  {
    path: config.routes.ORDER_MANAGEMENT,
    element: <Order />,
    label: "Order",
  },
  {
    path: config.routes.CUSTOMER_MANAGEMENT,
    element: <Customer />,
    label: "Customer",
  },
];
