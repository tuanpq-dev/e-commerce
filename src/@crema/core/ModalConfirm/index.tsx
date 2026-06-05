import { Modal } from "antd";
import type { ReactNode } from "react";

type ModalConfirmProps = {
  open: boolean;
  title?: string;
  message?: string;
  targetName?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  disabled?: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const ModalConfirm = ({
  open,
  title = "Xóa",
  message = "Bạn có chắc chắn muốn xóa",
  targetName,
  description,
  confirmText = "Xóa",
  cancelText = "Hủy",
  confirmLoading = false,
  disabled = false,
  onCancel,
  onOk,
}: ModalConfirmProps) => {
  const content = description ?? (
    <>
      {message}
      {targetName ? (
        <>
          :{" "}
          <span style={{ color: "red", fontStyle: "italic" }}>
            {targetName}
          </span>
        </>
      ) : (
        "?"
      )}
    </>
  );

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      okButtonProps={{ danger: true, disabled }}
      okText={confirmText}
      cancelText={cancelText}
    >
      <div>{content}</div>
    </Modal>
  );
};

export default ModalConfirm;
