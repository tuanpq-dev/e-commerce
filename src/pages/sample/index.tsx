import React from "react";
import config from "../../config";

// eslint-disable-next-line react-refresh/only-export-components
const Dashboard = React.lazy(() => import("../components/dashboard"));
const Product = React.lazy(() => import("../components/product"));
const Category = React.lazy(() => import("../components/category"));
const Order = React.lazy(() => import("../components/order"));
const Customer = React.lazy(() => import("../components/customer"));
const Profile = React.lazy(() => import("../../features/auth/profile"));

import {
  FolderOpenOutlined,
  HomeOutlined,
  OrderedListOutlined,
  ProductOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";

export const samplePageConfig = [
  {
    icon: <HomeOutlined />,
    path: config.routes.DASHBOARD,
    element: <Dashboard />,
    label: "Dashboard",
  },
  {
    icon: <ProductOutlined />,
    path: config.routes.PRODUCT_MANAGEMENT,
    element: <Product />,
    label: "Product",
  },
  {
    icon: <FolderOpenOutlined />,
    path: config.routes.CATEGORY_MANAGEMENT,
    element: <Category />,
    label: "Category",
  },
  {
    icon: <OrderedListOutlined />,
    path: config.routes.ORDER_MANAGEMENT,
    element: <Order />,
    label: "Order",
  },
  {
    icon: <UserOutlined />,
    path: config.routes.CUSTOMER_MANAGEMENT,
    element: <Customer />,
    label: "Customer",
  },
  {
    icon: <SettingOutlined />,
    path: config.routes.PROFILE,
    element: <Profile />,
    label: "Profile",
  },
];
