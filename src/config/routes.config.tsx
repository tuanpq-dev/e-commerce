const routes = {
  DASHBOARD: "dashboard",
  PRODUCT_MANAGEMENT: "product-management",
  CATEGORY_MANAGEMENT: "category-management",
  ORDER_MANAGEMENT: "order-management",
  CUSTOMER_MANAGEMENT: "customer-management",
  PROFILE: "profile",
  DETAIL_CUSTOMER: (id: string | number) => `customer-management/${id}`,
  DETAIL_ORDER: (order_code: string | number) =>
    `order-management/${order_code}`,
  CATEGORY_CHILD: (id: number | string) => `category-management/${id}`,
};

export default routes;
