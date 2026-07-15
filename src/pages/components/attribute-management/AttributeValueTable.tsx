import React from "react";
import { Table, Tag, Tooltip, Space, InputNumber, Typography, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { AttributeValueItem } from "../../../types/domain";
import formatCurrency from "../../../utils/formatCurrecy";
import type { EditingModifier } from "./useAttributeManagement";
import AntButton from "../../../@crema/component/AntButton";

const { Text } = Typography;

interface AttributeValueTableProps {
  titleId: number;
  values: AttributeValueItem[];
  editingModifier: EditingModifier | null;
  setEditingModifier: React.Dispatch<React.SetStateAction<EditingModifier | null>>;
  onSave?: (valueId: number, modifier: number) => Promise<void>;
  onDeleteValue?: (titleId: number, val: AttributeValueItem) => Promise<void>;
}

export const AttributeValueTable: React.FC<AttributeValueTableProps> = ({
  titleId,
  values,
  editingModifier,
  setEditingModifier,
  onSave,
  onDeleteValue,
}) => {
  const columns = [
    {
      title: "Giá trị",
      dataIndex: "value",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: (
        <Tooltip title="Cộng hoặc trừ thêm vào base_price của sản phẩm">
          ± Chênh lệch giá{" "}
          <Text type="secondary" style={{ fontSize: 11 }}>
            (VNĐ)
          </Text>
        </Tooltip>
      ),
      dataIndex: "price_modifier_amount",
      width: 220,
      render: (amount: number, record: AttributeValueItem) => {
        const isEditing =
          editingModifier?.titleId === titleId && editingModifier.valueId === record.id;

        if (isEditing) {
          return (
            <Space>
              <InputNumber
                value={editingModifier.draft}
                onChange={(v) =>
                  setEditingModifier((prev) => (prev ? { ...prev, draft: v ?? 0 } : null))
                }
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => Number(v?.replace(/,/g, "") ?? 0)}
                style={{ width: 130 }}
                autoFocus
              />
              <AntButton
                type="primary"
                size="small"
                onClick={() => onSave?.(record.id, editingModifier.draft)}
              >
                Lưu
              </AntButton>
              <AntButton size="small" onClick={() => setEditingModifier(null)}>
                Hủy
              </AntButton>
            </Space>
          );
        }

        return (
          <Space>
            <span
              style={{
                color: amount > 0 ? "#52c41a" : amount < 0 ? "#ff4d4f" : "#999",
                fontWeight: 500,
              }}
            >
              {amount === 0 ? "Không đổi" : (amount > 0 ? "+" : "") + formatCurrency(amount)}
            </span>
            <AntButton
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingModifier({ titleId, valueId: record.id, draft: amount })}
            />
          </Space>
        );
      },
    },
    {
      title: "Hành động",
      width: 100,
      render: (_: unknown, record: AttributeValueItem) => (
        <Popconfirm
          title={`Xóa giá trị "${record.value}"?`}
          onConfirm={() => onDeleteValue?.(titleId, record)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <AntButton
            danger
            size="small"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={values}
      pagination={false}
      size="small"
      style={{ marginBottom: 12 }}
      locale={{ emptyText: "Chưa có giá trị nào trong nhóm này." }}
    />
  );
};
