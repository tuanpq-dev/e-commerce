import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Collapse,
  Drawer,
  Flex,
  InputNumber,
  Popconfirm,
  Select,
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
  WarningOutlined,
} from "@ant-design/icons";
import type {
  AttributeGroup,
  AttributeTitle,
  AttributeValueItem,
  DataType,
  VariantCombinationMap,
} from "../../types/domain";
import openNotification from "../../@crema/core/Notification";
import { UpdateProduct } from "../../api/productApi";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";

import formatCurrency from "../../utils/formatCurrecy";
import {
  resolveCombinations,
  migrateAttributesOnChange,
  deleteVariantFromMap,
  applyBulkStock,
  countAffectedCombinations,
  type ResolvedCombination,
} from "../../utils/variantEngine";
import axiosClient from "../../api/axiosClient";

const { Text, Title } = Typography;
const { Panel } = Collapse;
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const ProductAttributeManagement: React.FC = () => {
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const [totalItems, setTotalItems] = useState(0);

  // ── Danh sách sản phẩm ─────────────────────────────────────
  const [products, setProducts] = useState<DataType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // ── Pool toàn cục ───────────────────────────────────────────
  const [allTitles, setAllTitles] = useState<AttributeTitle[]>([]);
  const [allValuePool, setAllValuePool] = useState<
    Record<number, AttributeValueItem[]>
  >({});

  // ── Drawer state ────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DataType | null>(null);

  // Bản nháp thuộc tính + stock khi đang edit trong Drawer
  const [draftGroups, setDraftGroups] = useState<AttributeGroup[]>([]);
  const [draftVariantMap, setDraftVariantMap] = useState<VariantCombinationMap>(
    {},
  );
  const [prevGroups, setPrevGroups] = useState<AttributeGroup[]>([]);
  const [bulkStock, setBulkStock] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const { data, meta } = await axiosClient.post('/product/search', {
        page: currentPage,
        pageSize,
      });
      if (!data) {
        return 'Không có dữ liệu'
      }
      setTotalItems(meta?.totalItems ?? 0);
      const mappedData = data.map((prod: any) => {
        const vMap: VariantCombinationMap = {};
        (prod.variants || []).forEach((variant: any) => {
          if (variant.comboKey) {
            vMap[variant.comboKey] = {
              stock: variant.stock ?? 0,
            };
          }
        });
        return {
          ...prod,
          variant_map: vMap,
        };
      });

      setProducts(mappedData);

      const titlesMap = new Map<number, string>();
      const valuePoolMap: Record<number, AttributeValueItem[]> = {};

      (data || []).forEach((prod: any) => {
        if (prod.attributesDetails) {
          Object.entries(prod.attributesDetails).forEach(([titleId, groupObj]: [string, any]) => {
            if (groupObj && groupObj.name) {
              const numTitleId = Number(titleId);
              titlesMap.set(numTitleId, groupObj.name);

              if (!valuePoolMap[numTitleId]) {
                valuePoolMap[numTitleId] = [];
              }

              (groupObj.values || []).forEach((val: any) => {
                const numValId = Number(val.id);
                const exists = valuePoolMap[numTitleId].some(
                  (v) => Number(v.id) === numValId
                );
                if (!exists) {
                  valuePoolMap[numTitleId].push({
                    id: numValId,
                    value: val.value,
                    price_modifier_amount: val.price_modifier_amount ?? val.priceModifierAmount ?? 0,
                  });
                }
              });
            }
          });
        }
      });

      setAllTitles(
        Array.from(titlesMap.entries()).map(([id, name]) => ({
          id,
          name,
        }))
      );
      setAllValuePool(valuePoolMap);
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể tải danh sách sản phẩm.",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Mở Drawer ─────────────────────────────────────────────
  const openDrawer = (product: DataType) => {
    setSelectedProduct(product);

    // Convert attributesDetails object to AttributeGroup[]
    const groups: AttributeGroup[] = Object.entries((product as any).attributesDetails || {}).map(([titleId, groupObj]: [string, any]) => ({
      titleId: Number(titleId),
      name: groupObj.name,
      values: (groupObj.values || []).map((val: any) => ({
        id: Number(val.id),
        value: val.value,
        price_modifier_amount: val.price_modifier_amount ?? val.priceModifierAmount ?? 0,
      })),
    }));

    const vMap = product.variant_map ?? {};

    setDraftGroups(groups);
    setDraftVariantMap(vMap);
    setPrevGroups(groups);
    setBulkStock(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedProduct(null);
  };

  // ── Computed combinations ─────────────────────────────────
  const resolvedCombinations = useMemo<ResolvedCombination[]>(() => {
    const basePrice = Number(
      selectedProduct?.basePrice ?? selectedProduct?.price ?? 0,
    );
    return resolveCombinations(basePrice, draftGroups, draftVariantMap);
  }, [draftGroups, draftVariantMap, selectedProduct]);

  const variantSummary = useMemo(() => {
    const totalStock = resolvedCombinations.reduce((s, c) => s + c.stock, 0);
    const prices = resolvedCombinations.map((c) => c.finalPrice);
    return {
      totalStock,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [resolvedCombinations]);

  // Titles chưa được dùng trong sản phẩm đang chọn
  const usedTitleIds = new Set(draftGroups.map((g) => g.titleId));
  const availableTitles = allTitles.filter((t) => !usedTitleIds.has(t.id));

  // ── Handlers — Groups ────────────────────────────────────
  const handleAddGroup = (titleId: number) => {
    const title = allTitles.find((t) => t.id === titleId);
    if (!title) return;

    const newGroups = [
      ...draftGroups,
      { titleId: title.id, name: title.name, values: [] },
    ];
    const migrated = migrateAttributesOnChange(
      prevGroups,
      newGroups,
      draftVariantMap,
    );

    setDraftGroups(newGroups);
    setDraftVariantMap(migrated);
    setPrevGroups(newGroups);
  };

  const handleRemoveGroup = (titleId: number) => {
    const newGroups = draftGroups.filter((g) => g.titleId !== titleId);
    const migrated = migrateAttributesOnChange(
      draftGroups,
      newGroups,
      draftVariantMap,
    );
    setDraftGroups(newGroups);
    setDraftVariantMap(migrated);
    setPrevGroups(newGroups);
  };

  // ── Handlers — Values ────────────────────────────────────
  const handleAddValue = (titleId: number, value: AttributeValueItem) => {
    const newGroups = draftGroups.map((g) =>
      g.titleId !== titleId ? g : { ...g, values: [...g.values, value] },
    );
    const migrated = migrateAttributesOnChange(
      prevGroups,
      newGroups,
      draftVariantMap,
    );
    setDraftGroups(newGroups);
    setDraftVariantMap(migrated);
    setPrevGroups(newGroups);
  };

  const handleRemoveValue = (titleId: number, valueId: number) => {
    const newGroups = draftGroups.map((g) =>
      g.titleId !== titleId
        ? g
        : { ...g, values: g.values.filter((v) => v.id !== valueId) },
    );
    const migrated = migrateAttributesOnChange(
      draftGroups,
      newGroups,
      draftVariantMap,
    );
    setDraftGroups(newGroups);
    setDraftVariantMap(migrated);
    setPrevGroups(newGroups);
  };

  // ── Handlers — Stock ─────────────────────────────────────
  const handleUpdateStock = (key: string, stock: number) => {
    setDraftVariantMap((prev) => ({ ...prev, [key]: { stock } }));
  };

  const handleDeleteCombination = (valueIds: string[]) => {
    setDraftVariantMap((prev) => deleteVariantFromMap(prev, valueIds));
  };

  const handleBulkApply = () => {
    if (bulkStock == null) return;
    const currentMap: VariantCombinationMap = {};
    for (const combo of resolvedCombinations) {
      currentMap[combo.key] = { stock: combo.stock };
    }
    setDraftVariantMap(applyBulkStock(currentMap, bulkStock));
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      // Sync resolved → final map
      const finalMap: VariantCombinationMap = {};
      for (const combo of resolvedCombinations) {
        finalMap[combo.key] = { stock: combo.stock };
      }

      await UpdateProduct({
        id: selectedProduct.id!,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        basePrice: selectedProduct.basePrice ?? selectedProduct.price,
        category: selectedProduct.category,
        category_child: selectedProduct.category_child,
        attribute_groups: draftGroups,
        variant_map: finalMap,
      });

      await CreateActiveLog({
        module: "ProductAttribute",
        action: `UPDATE - ${selectedProduct.name}`,
        user: userInfo?.fullname || "",
      });

      openNotification("success", {
        message: "Đã lưu",
        description: `Cập nhật thuộc tính cho "${selectedProduct.name}" thành công.`,
      });

      await fetchProducts();
      closeDrawer();
    } catch {
      openNotification("error", {
        message: "Lỗi",
        description: "Không thể lưu thay đổi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Columns bảng tổ hợp ──────────────────────────────────
  const combinationColumns = [
    {
      title: "#",
      width: 40,
      render: (_: unknown, __: unknown, i: number) => i + 1,
    },
    {
      title: "Tổ hợp",
      render: (_: unknown, record: ResolvedCombination) => (
        <Space size={4} wrap>
          {record.labels.map((lbl, i) => (
            <Tag key={i} color="blue">
              {lbl}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Giá cuối",
      width: 140,
      render: (_: unknown, record: ResolvedCombination) => (
        <Text style={{ color: "#1677ff", fontWeight: 500 }}>
          {formatCurrency(record.finalPrice)}
        </Text>
      ),
    },
    {
      title: "Tồn kho",
      width: 130,
      render: (_: unknown, record: ResolvedCombination) => (
        <InputNumber
          min={0}
          value={record.stock}
          onChange={(v) => handleUpdateStock(record.key, v ?? 0)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "",
      width: 56,
      render: (_: unknown, record: ResolvedCombination) => (
        <Popconfirm
          title="Xóa tổ hợp này?"
          onConfirm={() => handleDeleteCombination(record.valueIds)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // ── Columns bảng sản phẩm chính ──────────────────────────
  const productColumns = [
    {
      title: "SKU",
      dataIndex: "sku",
      width: 120,
      render: (sku: string) => (
        <Text code style={{ fontSize: 12 }}>
          {sku}
        </Text>
      ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      render: (name: string, record: DataType) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 500 }}
          onClick={() => openDrawer(record)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: "Nhóm thuộc tính",
      render: (_: unknown, record: DataType) => {
        const groups = Object.keys(record.attributesDetails ?? []).length;
        return (
          <Space wrap size={4}>
            <Tag>{groups} thuộc tính</Tag>
          </Space>
        );
      },
    },
    {
      title: "Tổ hợp",
      width: 90,
      render: (_: unknown, record: DataType) => {
        const count = (record.variants ?? []).length;
        return (
          <Tag color={count > 0 ? "green" : "default"}>{count} tổ hợp</Tag>
        );
      },
    },
    {
      title: "Tổng kho",
      width: 100,
      render: (_: unknown, record: DataType) => {
        const total = Object.values(record.variant_map ?? {}).reduce(
          (s, v) => s + v.stock,
          0,
        );
        return (
          <Text style={{ color: total === 0 ? "#ff4d4f" : undefined }}>
            {total === 0 ? (
              <>
                <WarningOutlined /> 0
              </>
            ) : (
              total
            )}
          </Text>
        );
      },
    },
    {
      title: "Hành động",
      width: 120,
      render: (_: unknown, record: DataType) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EditOutlined />}
          onClick={() => openDrawer(record)}
        >
          Quản lý
        </Button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Quản lý Thuộc tính theo Sản phẩm
        </Title>
        <Text type="secondary">
          Click vào sản phẩm để xem và chỉnh sửa thuộc tính, tổ hợp kho.
        </Text>
      </div>

      {/* Bảng sản phẩm */}
      <Table<DataType>
        rowKey="sku"
        columns={productColumns}
        dataSource={products}
        loading={isLoadingProducts}
        size="middle"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          showTotal: (total, range) =>
            `${t("activeLog.pagination", {
              count: range[1] - range[0] + 1,
              total,
            })}`,
          onChange: (page, size) => {
            setSearchParams({
              _page: String(page),
              _per_page: String(size),
            });
          },
        }}
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          style: { cursor: "pointer" },
          onClick: () => openDrawer(record),
        })}
      />

      {/* ═══ DRAWER CHI TIẾT ═══ */}
      <Drawer
        title={
          selectedProduct ? (
            <Flex vertical gap={2}>
              <span style={{ fontWeight: 700 }}>{selectedProduct.name}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedProduct.sku} · Base price:{" "}
                {formatCurrency(
                  Number(selectedProduct.basePrice ?? selectedProduct.price),
                )}
              </Text>
            </Flex>
          ) : (
            "Chi tiết thuộc tính"
          )
        }
        placement="right"
        size="min(680px, 100vw)"
        open={drawerOpen}
        onClose={closeDrawer}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={closeDrawer}>Hủy</Button>
            <Button type="primary" loading={isSaving} onClick={handleSave}>
              Lưu thay đổi
            </Button>
          </Flex>
        }
      >
        {selectedProduct && (
          <Spin spinning={isSaving}>
            {/* ── Nhóm thuộc tính đang dùng ── */}
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: "block", marginBottom: 10 }}>
                🏷️ Nhóm thuộc tính đang dùng
              </Text>

              <Flex wrap gap={8} style={{ marginBottom: 10 }}>
                {draftGroups.map((group) => {
                  const affected = countAffectedCombinations(
                    draftVariantMap,
                    group,
                  );
                  return (
                    <Popconfirm
                      key={group.titleId}
                      title={
                        affected > 0
                          ? `Xóa nhóm "${group.name}" sẽ xóa ${affected} tổ hợp kho. Tiếp tục?`
                          : `Xóa nhóm "${group.name}"?`
                      }
                      icon={
                        affected > 0 ? (
                          <WarningOutlined style={{ color: "orange" }} />
                        ) : undefined
                      }
                      onConfirm={() => handleRemoveGroup(group.titleId)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Tag
                        closable
                        color="processing"
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClose={(e) => {
                          e.preventDefault();
                          // Popconfirm handles it
                        }}
                      >
                        {group.name}
                      </Tag>
                    </Popconfirm>
                  );
                })}

                {availableTitles.length > 0 && (
                  <Select
                    placeholder={
                      <>
                        <PlusOutlined /> Thêm nhóm
                      </>
                    }
                    style={{ width: 160 }}
                    value={null}
                    onChange={handleAddGroup}
                    options={availableTitles.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                    size="small"
                  />
                )}
              </Flex>
            </div>

            {/* ── Giá trị từng nhóm ── */}
            {draftGroups.length > 0 && (
              <Collapse
                size="small"
                defaultActiveKey={draftGroups.map((g) => g.titleId)}
                style={{ marginBottom: 20 }}
              >
                {draftGroups.map((group) => {
                  const poolValues = allValuePool[group.titleId] ?? [];
                  const usedValueIds = new Set(group.values.map((v) => v.id));
                  const availableValues = poolValues.filter(
                    (v) => !usedValueIds.has(v.id),
                  );

                  return (
                    <Panel
                      key={group.titleId}
                      header={
                        <Text strong>
                          {group.name}{" "}
                          <Text type="secondary">
                            ({group.values.length} giá trị)
                          </Text>
                        </Text>
                      }
                    >
                      <Flex wrap gap={6} style={{ marginBottom: 10 }}>
                        {group.values.map((val) => (
                          <Tooltip
                            key={val.id}
                            title={
                              val.price_modifier_amount !== 0
                                ? `± ${formatCurrency(val.price_modifier_amount)}`
                                : "Không đổi giá"
                            }
                          >
                            <Tag
                              closable
                              color="blue"
                              onClose={() =>
                                handleRemoveValue(group.titleId, val.id)
                              }
                            >
                              {val.value}
                              {val.price_modifier_amount !== 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    marginLeft: 4,
                                    opacity: 0.75,
                                  }}
                                >
                                  {val.price_modifier_amount > 0 ? "+" : ""}
                                  {(val.price_modifier_amount / 1000).toFixed(
                                    0,
                                  )}
                                  k
                                </span>
                              )}
                            </Tag>
                          </Tooltip>
                        ))}

                        {availableValues.length > 0 && (
                          <Select
                            placeholder={
                              <>
                                <PlusOutlined /> Thêm từ pool
                              </>
                            }
                            size="small"
                            style={{ width: 160 }}
                            value={null}
                            onChange={(valueId: number) => {
                              const found = poolValues.find(
                                (v) => v.id === valueId,
                              );
                              if (found) handleAddValue(group.titleId, found);
                            }}
                            options={availableValues.map((v) => ({
                              value: v.id,
                              label: `${v.value}${v.price_modifier_amount !== 0 ? ` (${v.price_modifier_amount > 0 ? "+" : ""}${(v.price_modifier_amount / 1000).toFixed(0)}k)` : ""}`,
                            }))}
                          />
                        )}

                        {availableValues.length === 0 &&
                          group.values.length > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Đã chọn hết giá trị trong pool
                            </Text>
                          )}
                      </Flex>
                    </Panel>
                  );
                })}
              </Collapse>
            )}

            {/* ── Bảng tổ hợp kho ── */}
            {resolvedCombinations.length > 0 && (
              <>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  📦 Tổ hợp kho ({resolvedCombinations.length})
                </Text>

                {/* Bulk apply */}
                <Flex gap={8} align="center" style={{ marginBottom: 12 }}>
                  <InputNumber
                    min={0}
                    value={bulkStock}
                    onChange={(value) => setBulkStock(value !== null ? Number(value) : null)}
                    placeholder="Áp dụng tất cả..."
                    style={{ width: 180 }}
                  />
                  <Button
                    type="default"
                    onClick={handleBulkApply}
                    disabled={bulkStock == null}
                    size="small"
                  >
                    Áp dụng tất cả
                  </Button>
                </Flex>

                <Table
                  rowKey="key"
                  columns={combinationColumns}
                  dataSource={resolvedCombinations}
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                  style={{ marginBottom: 12 }}
                />

                {/* Summary */}
                <Flex justify="flex-end" gap={24} style={{ fontSize: 13 }}>
                  <span>
                    Tổng kho:{" "}
                    <strong style={{ color: "#1677ff" }}>
                      {variantSummary.totalStock}
                    </strong>
                  </span>
                  <span>
                    Khoảng giá:{" "}
                    <strong style={{ color: "#1677ff" }}>
                      {variantSummary.minPrice === variantSummary.maxPrice
                        ? formatCurrency(variantSummary.minPrice)
                        : `${formatCurrency(variantSummary.minPrice)} – ${formatCurrency(variantSummary.maxPrice)}`}
                    </strong>
                  </span>
                </Flex>
              </>
            )}

            {draftGroups.length > 0 && resolvedCombinations.length === 0 && (
              <Text type="secondary">
                Chưa có tổ hợp nào. Thêm giá trị vào các nhóm thuộc tính để tạo
                tổ hợp.
              </Text>
            )}

            {draftGroups.length === 0 && (
              <Text type="secondary">
                Sản phẩm này chưa có nhóm thuộc tính. Thêm nhóm từ pool bên
                trên.
              </Text>
            )}
          </Spin>
        )}
      </Drawer>
    </div>
  );
};

export default ProductAttributeManagement;
