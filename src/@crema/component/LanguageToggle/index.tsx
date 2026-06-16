import React from "react";
import { GlobalOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";

  const handleToggle = () => {
    const nextLang = currentLang === "vi" ? "en" : "vi";
    i18n.changeLanguage(nextLang);
  };

  return (
    <Tooltip title={currentLang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        onClick={handleToggle}
        style={{ fontWeight: 500 }}
      >
        {currentLang.toUpperCase()}
      </Button>
    </Tooltip>
  );
};

export default LanguageToggle;
