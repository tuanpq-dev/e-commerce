import { Breadcrumb } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import config from "../../../../config";
import { menuConfig } from "../../../../pages/sample/menu.config";

const ROUTE_LABELS: Record<string, string> = {
  [config.routes.DASHBOARD]: "Dashboard",
  [config.routes.PRODUCT_MANAGEMENT]: "Product",
  [config.routes.CATEGORY_MANAGEMENT]: "Category",
  [config.routes.ORDER_MANAGEMENT]: "Order",
  [config.routes.CUSTOMER_MANAGEMENT]: "Customer",
  [config.routes.ACTIVE_LOG]: "Active",
  [config.routes.PROFILE]: "Profile",
  [config.routes.SHOP_CART]: "Shop Cart",
};

const getDetailLabel = (parentPath: string, id: string) => {
  if (parentPath === config.routes.CATEGORY_MANAGEMENT) {
    return `Danh mục con #${id}`;
  }

  if (parentPath === config.routes.CUSTOMER_MANAGEMENT) {
    return `Chi tiết khách hàng #${id}`;
  }

  if (parentPath === config.routes.ORDER_MANAGEMENT) {
    return `Chi tiết đơn hàng #${id}`;
  }

  return `Chi tiết #${id}`;
};

const AppBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return null;
  }

  const [parentPath, detailId] = segments;
  const parentLabel =
    ROUTE_LABELS[parentPath] ??
    menuConfig.find((item) => item.path === parentPath)?.label ??
    parentPath;
  const isHomePage = parentPath === config.routes.DASHBOARD && !detailId;

  const items = [
    {
      title: isHomePage ? (
        "Home"
      ) : (
        <button
          className="breadcrumb-link"
          type="button"
          onClick={() => navigate(`/${config.routes.DASHBOARD}`)}
        >
          Home
        </button>
      ),
    },
  ];

  if (parentPath !== config.routes.DASHBOARD) {
    items.push({
      title: detailId ? (
        <button
          className="breadcrumb-link"
          type="button"
          onClick={() => navigate(`/${parentPath}`)}
        >
          {parentLabel}
        </button>
      ) : (
        parentLabel
      ),
    });
  }

  if (detailId) {
    items.push({
      title: getDetailLabel(parentPath, detailId),
    });
  }

  return (
    <div className="app-breadcrumb">
      <Breadcrumb separator="/" items={items} />
    </div>
  );
};

export default AppBreadcrumb;
