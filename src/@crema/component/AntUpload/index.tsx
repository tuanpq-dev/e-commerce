import { Button, Form, Image, Upload } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

type AntUploadProps = {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  width?: number;
  height?: number;
  buttonText?: string;
  shape?: "square" | "circle";
  required?: boolean;
};

const AntUpload = ({
  label = "Ảnh",
  name = "image",
  value,
  onChange,
  width = 120,
  height = 120,
  buttonText = "Chọn ảnh",
  shape = "square",
  required = false,
}: AntUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    }
  }, [value]);

  const handlePreview: UploadProps["beforeUpload"] = (file) => {
    const url = URL.createObjectURL(file);

    setPreviewUrl(url);
    onChange?.(url);

    return false;
  };

  return (
    <Form.Item
      label={label}
      name={name}
      rules={
        required
          ? [
              {
                required: true,
                message: `Vui lòng chọn ${label.toLowerCase()}`,
              },
            ]
          : []
      }
    >
      <Upload
        beforeUpload={handlePreview}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />}>{buttonText}</Button>
      </Upload>

      {previewUrl && (
        <Image
          src={previewUrl}
          width={width}
          height={height}
          style={{
            marginTop: 16,
            objectFit: "cover",
            borderRadius: shape === "circle" ? "50%" : 8,
          }}
        />
      )}
    </Form.Item>
  );
};

export default AntUpload;
