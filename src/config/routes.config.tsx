const routes = {
  DASHBOARD: "dashboard",
  PRODUCT_MANAGEMENT: "product-management",
  CATEGORY_MANAGEMENT: "category-management",
  ORDER_MANAGEMENT: "order-management",
  CUSTOMER_MANAGEMENT: "customer-management",
  PROFILE: "profile",
  DETAIL_CUSTOMER: (id: string | number) => `customer-management/${id}`,
};

export default routes;
