import React from "react";
import { Table, Tag, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { AttributeValueItem } from "../../../types/domain";
import type { EditingModifier } from "./useAttributeManagement";
import AntButton from "../../../@crema/component/AntButton";

interface AttributeValueTableProps {
  titleId: string | number;
  values: AttributeValueItem[];
  editingModifier: EditingModifier | null;
  setEditingModifier: React.Dispatch<React.SetStateAction<EditingModifier | null>>;
  onSave?: (valueId: string | number, modifier: number) => Promise<void>;
  onDeleteValue?: (titleId: string | number, val: AttributeValueItem) => Promise<void>;
}

export const AttributeValueTable: React.FC<AttributeValueTableProps> = ({
  titleId,
  values,
  onDeleteValue,
}) => {
  const columns = [
    {
      title: "Giá trị",
      dataIndex: "value",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
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
