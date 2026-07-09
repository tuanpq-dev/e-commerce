/**
 * Page 1 — Quản lý Thuộc tính Toàn cục (Attribute Pool)
 *
 * Admin quản lý tập trung:
 *  - Danh sách nhóm thuộc tính (Size, Màu, Chất liệu, ...)
 *  - Danh sách giá trị kèm price_modifier_amount của từng nhóm
 *
 * Đây là nguồn chân lý (single source of truth) cho toàn bộ hệ thống.
 * Sản phẩm chỉ được chọn từ pool này, không tự nhập.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TagsOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { AttributeTitle, AttributeValueItem } from "../../types/domain";
import openNotification from "../../@crema/core/Notification";
import {
  CreateAttributeTitle,
  DeleteAttributeTitle,
  AddAttributeValue,
  UpdateAttributeValueModifier,
  DeleteAttributeValue,
  CountProductsUsingValue,
} from "../../api/attributeApi";
import formatCurrency from "../../utils/formatCurrecy";
import axiosClient from "../../api/axiosClient";

const { Title, Text } = Typography;
const { Panel } = Collapse;

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

const AttributeManagement: React.FC = () => {
  // ── State ────────────────────────────────────────────────────
  const [titles, setTitles] = useState<AttributeTitle[]>([]);
  const [valuePool, setValuePool] = useState<
    Record<string, AttributeValueItem[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Modal thêm nhóm mới
  const [isAddTitleOpen, setIsAddTitleOpen] = useState(false);
  const [addTitleForm] = Form.useForm<{ name: string }>();
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Modal thêm giá trị mới
  const [addValueState, setAddValueState] = useState<{
    open: boolean;
    titleId: string;
    titleName: string;
  }>({ open: false, titleId: "", titleName: "" });
  const [addValueForm] = Form.useForm<{ value: string; modifier: number }>();
  const [isSavingValue, setIsSavingValue] = useState(false);

  // Inline edit modifier
  const [editingModifier, setEditingModifier] = useState<{
    titleId: string;
    valueId: string;
    draft: number;
  } | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await axiosClient.get('/attribute/pool').then((res) => {
        const data = res.data || [];
        
        const mappedTitles = data.map((item: any) => ({
          id: String(item.id),
          name: item.name
        }));
        setTitles(mappedTitles);

        const pool: Record<string, AttributeValueItem[]> = {};
        data.forEach((item: any) => {
          pool[String(item.id)] = (item.attributeValues || []).map((val: any) => ({
            id: String(val.id),
            value: val.value,
            price_modifier_amount: val.priceModifierAmount ?? val.price_modifier_amount ?? 0
          }));
        });
        setValuePool(pool);
      })
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể tải dữ liệu thuộc tính.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Handlers — Nhóm ──────────────────────────────────────────

  const handleAddTitle = async () => {
    const { name } = await addTitleForm.validateFields();
    setIsSavingTitle(true);
    try {
      await CreateAttributeTitle(name.trim());
      openNotification("success", {
        message: "Thành công",
        description: `Đã thêm nhóm "${name}"`,
      });
      addTitleForm.resetFields();
      setIsAddTitleOpen(false);
      fetchAll();
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể thêm nhóm thuộc tính.",
      });
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteTitle = async (title: AttributeTitle) => {
    try {
      await DeleteAttributeTitle(title.id);
      openNotification("success", {
        message: "Đã xóa",
        description: `Nhóm "${title.name}" đã bị xóa.`,
      });
      fetchAll();
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể xóa nhóm.",
      });
    }
  };

  // ── Handlers — Giá trị ───────────────────────────────────────

  const openAddValue = (titleId: string, titleName: string) => {
    setAddValueState({ open: true, titleId, titleName });
    addValueForm.resetFields();
  };

  const handleAddValue = async () => {
    const { value, modifier } = await addValueForm.validateFields();
    setIsSavingValue(true);
    try {
      await AddAttributeValue(addValueState.titleId, value, modifier ?? 0);
      openNotification("success", {
        message: "Thành công",
        description: `Đã thêm giá trị "${value}"`,
      });
      addValueForm.resetFields();
      setAddValueState((prev) => ({ ...prev, open: false }));
      fetchAll();
    } catch (err) {
      openNotification("error", {
        message: "Lỗi",
        description:
          err instanceof Error ? err.message : "Không thể thêm giá trị.",
      });
    } finally {
      setIsSavingValue(false);
    }
  };

  const handleSaveModifier = async (
    titleId: string,
    valueId: string,
    modifier: number,
  ) => {
    try {
      await UpdateAttributeValueModifier(titleId, valueId, modifier);
      openNotification("success", {
        message: "Đã lưu",
        description: "Cập nhật modifier thành công.",
      });
      setEditingModifier(null);
      fetchAll();
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể cập nhật.",
      });
    }
  };

  const handleDeleteValue = async (
    titleId: string,
    val: AttributeValueItem,
  ) => {
    try {
      const usedBy = await CountProductsUsingValue(val.id);
      if (usedBy > 0) {
        // Hiển thị confirm với warning
        Modal.confirm({
          title: "Xóa giá trị đang được sử dụng",
          icon: <WarningOutlined style={{ color: "orange" }} />,
          content: `Giá trị "${val.value}" đang được dùng bởi ${usedBy} sản phẩm. Xóa khỏi pool sẽ không tự động xóa khỏi sản phẩm đó. Tiếp tục?`,
          okText: "Xóa",
          cancelText: "Hủy",
          okButtonProps: { danger: true },
          onOk: async () => {
            await DeleteAttributeValue(titleId, val.id);
            openNotification("success", {
              message: "Đã xóa",
              description: `Giá trị "${val.value}" đã bị xóa khỏi pool.`,
            });
            fetchAll();
          },
        });
      } else {
        await DeleteAttributeValue(titleId, val.id);
        openNotification("success", {
          message: "Đã xóa",
          description: `Giá trị "${val.value}" đã bị xóa.`,
        });
        fetchAll();
      }
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể xóa giá trị.",
      });
    }
  };

  // ── Columns bảng giá trị ─────────────────────────────────────

  const getValueColumns = (titleId: string) => [
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
          editingModifier?.titleId === titleId &&
          editingModifier.valueId === record.id;

        if (isEditing) {
          return (
            <Space>
              <InputNumber
                value={editingModifier.draft}
                onChange={(v) =>
                  setEditingModifier((prev) =>
                    prev ? { ...prev, draft: v ?? 0 } : null,
                  )
                }
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => Number(v?.replace(/,/g, "") ?? 0)}
                style={{ width: 130 }}
                autoFocus
              />
              <Button
                type="primary"
                size="small"
                onClick={() =>
                  handleSaveModifier(titleId, record.id, editingModifier.draft)
                }
              >
                Lưu
              </Button>
              <Button size="small" onClick={() => setEditingModifier(null)}>
                Hủy
              </Button>
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
              {amount === 0
                ? "Không đổi"
                : (amount > 0 ? "+" : "") + formatCurrency(amount)}
            </span>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() =>
                setEditingModifier({
                  titleId,
                  valueId: record.id,
                  draft: amount,
                })
              }
            />
          </Space>
        );
      },
    },
    {
      title: "Hành động",
      width: 100,
      render: (_: unknown, record: AttributeValueItem) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteValue(titleId, record)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="page-stack">
      {/* Header */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý Thuộc tính Toàn cục
          </Title>
          <Text type="secondary">
            Danh sách các thuộc tính dùng chung cho toàn bộ sản phẩm. Thêm giá
            trị tại đây trước khi gán cho sản phẩm.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddTitleOpen(true)}
        >
          Thêm nhóm
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" style={{ padding: 60 }}>
          <Spin size="large" />
        </Flex>
      ) : titles.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <TagsOutlined
            style={{ fontSize: 48, color: "#ccc", marginBottom: 16 }}
          />
          <div>
            Chưa có nhóm thuộc tính nào. Bắt đầu bằng cách thêm nhóm mới.
          </div>
        </Card>
      ) : (
        <Collapse
          defaultActiveKey={[]}
          style={{ background: "transparent" }}
        >
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
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Xóa nhóm
                    </Button>
                  </Popconfirm>
                }
              >
                <Table
                  rowKey="id"
                  columns={getValueColumns(title.id)}
                  dataSource={values}
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 12 }}
                  locale={{ emptyText: "Chưa có giá trị nào trong nhóm này." }}
                />

                <Divider style={{ margin: "8px 0" }} />

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => openAddValue(title.id, title.name)}
                >
                  Thêm giá trị vào "{title.name}"
                </Button>
              </Panel>
            );
          })}
        </Collapse>
      )}

      {/* Modal thêm nhóm mới */}
      <Modal
        title={
          <>
            <PlusOutlined /> Thêm nhóm thuộc tính mới
          </>
        }
        open={isAddTitleOpen}
        onOk={handleAddTitle}
        onCancel={() => {
          setIsAddTitleOpen(false);
          addTitleForm.resetFields();
        }}
        confirmLoading={isSavingTitle}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={addTitleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Tên nhóm thuộc tính"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhóm" },
              { min: 2, message: "Tên nhóm tối thiểu 2 ký tự" },
              { max: 40, message: "Tên nhóm tối đa 40 ký tự" },
            ]}
          >
            <Input placeholder="Ví dụ: Chất liệu, Họa tiết, Độ dày..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal thêm giá trị mới */}
      <Modal
        title={
          <>
            <PlusOutlined /> Thêm giá trị vào nhóm "{addValueState.titleName}"
          </>
        }
        open={addValueState.open}
        onOk={handleAddValue}
        onCancel={() => {
          setAddValueState((prev) => ({ ...prev, open: false }));
          addValueForm.resetFields();
        }}
        confirmLoading={isSavingValue}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={addValueForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Giá trị"
            name="value"
            rules={[
              { required: true, message: "Vui lòng nhập giá trị" },
              { max: 50, message: "Giá trị tối đa 50 ký tự" },
            ]}
          >
            <Input placeholder="Ví dụ: XL, Xanh lam, Lụa, Sọc ngang..." />
          </Form.Item>
          <Form.Item
            label={
              <Tooltip title="Cộng (+) hoặc trừ (-) thêm vào giá sàn của sản phẩm khi khách chọn giá trị này">
                Chênh lệch giá (±VNĐ){" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  tuỳ chọn
                </Text>
              </Tooltip>
            }
            name="modifier"
            initialValue={0}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => Number(v?.replace(/,/g, "") ?? 0)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttributeManagement;
