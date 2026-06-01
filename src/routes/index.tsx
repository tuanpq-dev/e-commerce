import { useRoutes } from "react-router-dom";
import { routes } from "../pages";

function AppRoutes() {
  return useRoutes(routes);
}

export default AppRoutes;
