import { Modal } from "antd";
import type { ProductInitialValues } from "../../../types/domain";

type ModalConfirmProps = {
  rowData: ProductInitialValues | null;
  isDeleteModal: boolean;
  isDeleting: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const ModalConfirm = ({
  rowData,
  onCancel,
  onOk,
  isDeleteModal,
  isDeleting,
}: ModalConfirmProps) => {
  return (
    <Modal
      title="Xóa"
      open={isDeleteModal}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={isDeleting}
      okButtonProps={{ danger: true, disabled: !rowData?.id }}
      okText="Xóa"
      cancelText="Hủy"
    >
      <div>
        Bạn có chắc chắn muốn xóa:{" "}
        <span style={{ color: "red", fontStyle: "italic" }}>
          {rowData?.name ?? ""}
        </span>
      </div>
    </Modal>
  );
};

export default ModalConfirm;
