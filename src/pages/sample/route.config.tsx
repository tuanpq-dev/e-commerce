import React from "react";
import config from "../../config";

// eslint-disable-next-line react-refresh/only-export-components
const Dashboard = React.lazy(() => import("../components/dashboard"));
const Product = React.lazy(() => import("../components/product"));
const Category = React.lazy(() => import("../components/category"));
const Order = React.lazy(() => import("../components/order"));
const Customer = React.lazy(() => import("../components/customer"));
const ActiveLog = React.lazy(() => import("../components/active-log"));
const Profile = React.lazy(() => import("../../features/auth/profile"));
const AttributeManagement = React.lazy(
  () => import("../components/attribute-management"),
);
const ProductAttributeManagement = React.lazy(
  () => import("../components/product-attribute-management"),
);
const DetailCustomer = React.lazy(
  () => import("../components/detail-customer"),
);
const DetailOrder = React.lazy(() => import("../components/detail-order"));
const Page403 = React.lazy(() => import("../components/403"));
const Permission = React.lazy(() => import("../components/permission"));

export const routeConfig = [
  {
    path: config.routes.DASHBOARD,
    element: <Dashboard />,
  },
  {
    path: config.routes.PRODUCT_MANAGEMENT,
    element: <Product />,
  },
  {
    path: config.routes.ATTRIBUTE_MANAGEMENT,
    element: <AttributeManagement />,
  },
  {
    path: config.routes.PRODUCT_ATTRIBUTE_MANAGEMENT,
    element: <ProductAttributeManagement />,
  },
  {
    path: config.routes.CATEGORY_MANAGEMENT,
    element: <Category />,
  },
  {
    path: config.routes.ORDER_MANAGEMENT,
    element: <Order />,
  },
  {
    path: config.routes.CUSTOMER_MANAGEMENT,
    element: <Customer />,
  },
  {
    path: config.routes.ACTIVE_LOG,
    element: <ActiveLog />,
  },
  {
    path: config.routes.PROFILE,
    element: <Profile />,
  },
  {
    path: config.routes.DETAIL_CUSTOMER(":id"),
    element: <DetailCustomer />,
  },
  {
    path: config.routes.DETAIL_ORDER(":id"),
    element: <DetailOrder />,
  },
  {
    path: "/403",
    element: <Page403 />,
  },
  {
    path: config.routes.PERMISSION,
    element: <Permission />
  }
];
