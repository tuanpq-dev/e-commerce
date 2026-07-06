import {
  AuditOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  OrderedListOutlined,
  ProductOutlined,
  SettingOutlined,
  TagsOutlined,
  UserOutlined,
} from "@ant-design/icons";
import config from "../../config";

export const menuConfig = [
  {
    icon: <HomeOutlined />,
    path: config.routes.DASHBOARD,
    label: "Dashboard",
  },
  {
    icon: <ProductOutlined />,
    path: config.routes.PRODUCT_MANAGEMENT,
    label: "Product",
  },
  {
    icon: <TagsOutlined />,
    path: config.routes.ATTRIBUTE_MANAGEMENT,
    label: "AttributePool",
  },
  {
    icon: <TagsOutlined />,
    path: config.routes.PRODUCT_ATTRIBUTE_MANAGEMENT,
    label: "ProductAttributes",
  },
  {
    icon: <FolderOpenOutlined />,
    path: config.routes.CATEGORY_MANAGEMENT,
    label: "Category",
  },
  {
    icon: <OrderedListOutlined />,
    path: config.routes.ORDER_MANAGEMENT,
    label: "Order",
  },
  {
    icon: <UserOutlined />,
    path: config.routes.CUSTOMER_MANAGEMENT,
    label: "Customer",
  },
  {
    icon: <AuditOutlined />,
    path: config.routes.ACTIVE_LOG,
    label: "Active",
  },
  {
    icon: <SettingOutlined />,
    path: config.routes.PROFILE,
    label: "Profile",
  },
];
