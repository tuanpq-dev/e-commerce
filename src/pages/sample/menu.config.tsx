import {
  FolderOpenOutlined,
  HomeOutlined,
  OrderedListOutlined,
  ProductOutlined,
  SettingOutlined,
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
    icon: <SettingOutlined />,
    path: config.routes.PROFILE,
    label: "Profile",
  },
];
