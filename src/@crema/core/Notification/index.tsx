import { notification } from "antd";
type NotificationType = "success" | "info" | "error" | "warning";

type OpenNotification = {
  message?: string;
  description?: string;
};

notification.config({
  duration: 3.5,
});

const openNotification = (
  type: NotificationType,
  { message, description }: OpenNotification,
) => {
  notification[type]({
    message: message,
    description: description,
  });
};

export default openNotification;
