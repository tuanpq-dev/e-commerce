import { BrowserRouter, useNavigate } from "react-router-dom";
import AppRoutes from "./routes";
import { setNavigate } from "./api/axiosClient";

const NavigateSetter = () => {
  const navigate = useNavigate();
  setNavigate(navigate);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <NavigateSetter />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
