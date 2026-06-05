import { Button, Tooltip } from "antd";
import type { ButtonProps, TooltipProps } from "antd";

type AntButtonProps = ButtonProps & {
  tooltip?: TooltipProps["title"];
};

const AntButton = ({ tooltip, ...props }: AntButtonProps) => {
  return (
    <Tooltip title={tooltip}>
      <Button {...props} />
    </Tooltip>
  );
};

export default AntButton;
