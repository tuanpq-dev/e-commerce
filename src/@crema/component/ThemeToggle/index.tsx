import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useThemeMode } from "../../../contexts/ThemeContext";

const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
      <Button
        type="text"
        icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
