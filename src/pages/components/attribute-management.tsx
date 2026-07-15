import React from "react";
import {
  Card,
  Collapse,
  Divider,
  Flex,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, TagsOutlined } from "@ant-design/icons";
import { useAttributeManagement } from "./attribute-management/useAttributeManagement";
import { AddTitleModal } from "./attribute-management/AddTitleModal";
import { AttributeValueTable } from "./attribute-management/AttributeValueTable";
import { AddValueModal } from "./attribute-management/AddValueModal";
import AntButton from "../../@crema/component/AntButton";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const AttributeManagement: React.FC = () => {
  const {
    titles,
    valuePool,
    isLoading,
    isAddTitleOpen,
    setIsAddTitleOpen,
    isSavingTitle,
    isSavingValue,
    editingModifier,
    setEditingModifier,
    addValueState,
    openAddValue,
    closeAddValue,
    handleAddTitle,
    handleDeleteTitle,
    handleUpdate,
    handleAddValue,
    editingTitle,
    setEditingTitle,
    handleSaveValueAttribute,
    handleDeleteValueAttribute
  } = useAttributeManagement();

  return (
    <div className="page-stack">
      <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý Thuộc tính Toàn cục
          </Title>
          <Text type="secondary">
            Danh sách các thuộc tính dùng chung cho toàn bộ sản phẩm. Thêm giá trị tại đây trước
            khi gán cho sản phẩm.
          </Text>
        </div>
        <AntButton type="primary" icon={<PlusOutlined />} onClick={() => setIsAddTitleOpen(true)}>
          Thêm nhóm
        </AntButton>
      </Flex>

      {isLoading ? (
        <Flex justify="center" style={{ padding: 60 }}>
          <Spin size="large" />
        </Flex>
      ) : titles.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <TagsOutlined style={{ fontSize: 48, color: "#ccc", marginBottom: 16 }} />
          <div>Chưa có nhóm thuộc tính nào. Bắt đầu bằng cách thêm nhóm mới.</div>
        </Card>
      ) : (
        <Collapse defaultActiveKey={[]} style={{ background: "transparent" }}>
          {titles.map((title) => {
            const values = valuePool[title.id] ?? [];
            return (
              <Panel
                key={title.id}
                header={
                  <Flex align="center" gap={8}>
                    <span style={{ fontWeight: 600 }}>{title.name}</span>
                    <Tag color="default">{values.length} giá trị</Tag>
                  </Flex>
                }
                extra={
                  <Space size="medium">
                    <AntButton
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitle(title);
                      }}
                    />
                    <Popconfirm
                      title={`Xóa nhóm "${title.name}"? Các giá trị trong nhóm sẽ bị xóa khỏi pool.`}
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteTitle(title);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <AntButton
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Space>
                }
              >
                <AttributeValueTable
                  titleId={title.id}
                  values={values}
                  editingModifier={editingModifier}
                  setEditingModifier={setEditingModifier}
                  onSave={handleSaveValueAttribute}
                  onDeleteValue={(_, record) => handleDeleteValueAttribute(record.id)}
                />
                <Divider style={{ margin: "8px 0" }} />
                <AntButton
                  type="dashed"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => openAddValue(title.id, title.name)}
                >
                  Thêm giá trị vào "{title.name}"
                </AntButton>
              </Panel>
            );
          })}
        </Collapse>
      )}

      <AddTitleModal
        open={isAddTitleOpen || !!editingTitle}
        confirmLoading={isSavingTitle}
        onCancel={() => {
          setIsAddTitleOpen(false);
          setEditingTitle(null);
        }}
        onOk={async (name) => {
          if (editingTitle) {
            return await handleUpdate(editingTitle.id, name);
          } else {
            return await handleAddTitle(name);
          }
        }}
        initialValue={editingTitle?.name}
        title={editingTitle ? "Cập nhật nhóm thuộc tính" : "Thêm nhóm thuộc tính mới"}
        okText={editingTitle ? "Cập nhật" : "Thêm"}
      />

      <AddValueModal
        open={addValueState.open}
        titleName={addValueState.titleName}
        confirmLoading={isSavingValue}
        onCancel={closeAddValue}
        onOk={handleAddValue}
      />
    </div>
  );
};

export default AttributeManagement;