import { Modal } from "antd";
import AntButton from "../../@crema/component/AntButton";
import { useState } from "react";

const safeStringify = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    try {
        return JSON.stringify(val);
    } catch {
        try {
            return Object.prototype.toString.call(val);
        } catch {
            return "[Object]";
        }
    }
};

const PayloadCell = ({ payload }: { payload: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (payload === null || payload === undefined) return <span>-</span>;

    const stringifyPayload = safeStringify(payload);
    const maxLetter = 60;

    if (!stringifyPayload || stringifyPayload === "{}" || stringifyPayload === "[]") {
        return <span>-</span>;
    }

    let displayObject = payload;
    if (typeof payload === "string") {
        try {
            displayObject = JSON.parse(payload);
        } catch {
            displayObject = payload;
        }
    }

    const formatModalContent = () => {
        if (typeof displayObject === "string") return displayObject;
        try {
            return JSON.stringify(displayObject, null, 2);
        } catch {
            return safeStringify(displayObject);
        }
    };

    if (stringifyPayload.length <= maxLetter) {
        return <code>{stringifyPayload}</code>;
    }

    return (
        <>
            <span>{stringifyPayload.slice(0, maxLetter)}... </span>
            <AntButton
                type="link"
                size="small"
                onClick={() => setIsModalOpen(true)}
                style={{ padding: 0 }}
            >
                Xem chi tiết
            </AntButton>

            <Modal
                title="Chi tiết Payload Nhật ký"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
            >
                <pre>
                    {formatModalContent()}
                </pre>
            </Modal>
        </>
    );
};

export default PayloadCell;