/**
 * Product Modal — Đã đơn giản hóa
 *
 * Luồng mới:
 *  1. Nhập thông tin cơ bản (tên, category, base_price)
 *  2. Chọn nhóm thuộc tính từ pool toàn cục
 *  3. Chọn giá trị cụ thể (từ pool, KHÔNG nhập tay)
 *  4. Save → stock sẽ được nhập tại trang "Quản lý thuộc tính theo sản phẩm"
 */

import { useMemo, useRef, useState } from "react";
import {
  Button,
  Divider,
  Form,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
  Image as AntdImage,
  message,
} from "antd";
import { PlusOutlined, TagsOutlined, UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import type {
  AttributeGroup,
  AttributeTitle,
  AttributeValueItem,
  CategoryType,
  ProductInitialValues,
  VariantCombinationMap,
} from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";
import { useTranslation } from "react-i18next";
import { generateUniqueParentSku } from "../../utils/skuGenerator";
import { generateAllCombinations, generateCombinationKey, getProductImages } from "../../utils/variantEngine";
import formatCurrency from "../../utils/formatCurrecy";
import axiosClient from "../../api/axiosClient";

const { Text } = Typography;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ImageItem {
  uid: string;
  url?: string;
  file?: File;
  previewUrl: string;
}

type ModalProductProps = {
  isUpdate?: boolean;
  initialValue?: ProductInitialValues | null;
  open: boolean;
  onCancel: () => void;
  onOk: (values: ProductInitialValues) => void;
  options: CategoryType[];
  /** Danh sách tên nhóm toàn hệ thống */
  attributeTitles?: AttributeTitle[];
  /** Pool giá trị toàn hệ thống: titleId → values[] */
  attributeValuePool?: Record<string, AttributeValueItem[]>;
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export const ModalProduct = ({
  isUpdate,
  initialValue,
  open,
  onCancel,
  onOk,
  options,
  attributeTitles = [],
  attributeValuePool = {},
}: ModalProductProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const selectedCategoryId = Form.useWatch("category", form);
  const watchedBasePrice = Form.useWatch("basePrice", form);

  const [tempParentSku, setTempParentSku] = useState("");
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const isInitializingRef = useRef(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Category child ─────────────────────────────────────────
  const selectedCategory = options.find(
    (opt) => String(opt.id) === String(selectedCategoryId),
  );
  const optionsChild = selectedCategory?.child ?? [];

  const normalizeCategoryChild = (
    categoryChild: ProductInitialValues["category_child"],
  ) =>
    (categoryChild ?? [])
      .map((item) => (typeof item === "object" ? item.id : item))
      .filter((item): item is string | number => item !== undefined);

  // ── Pool helpers ────────────────────────────────────────────
  const usedTitleIds = new Set(attributeGroups.map((g) => g.titleId));
  const availableTitles = attributeTitles.filter((t) => !usedTitleIds.has(t.id));

  // ── Preview tổ hợp sẽ được tạo ─────────────────────────────
  const previewCombinations = useMemo(() => {
    const allCombos = generateAllCombinations(attributeGroups as any);
    const basePrice = Number(watchedBasePrice) || 0;

    // Build label + price map
    const valueLabel = new Map<string, string>();
    const valueModifier = new Map<string, number>();
    for (const g of attributeGroups) {
      for (const v of g.values) {
        valueLabel.set(String(v.id), v.value);
        valueModifier.set(String(v.id), v.price_modifier_amount);
      }
    }

    return allCombos.slice(0, 8).map((ids) => {
      const key = generateCombinationKey(ids);
      const labels = ids.map((id) => valueLabel.get(id) ?? id);
      const price = basePrice + ids.reduce((s, id) => s + (valueModifier.get(id) ?? 0), 0);
      return { key, labels, price };
    });
  }, [attributeGroups, watchedBasePrice]);

  // ── Handlers ────────────────────────────────────────────────
  const handleAddGroup = (titleId: string) => {
    const title = attributeTitles.find((t) => String(t.id) === String(titleId));
    if (!title) return;
    setAttributeGroups((prev) => [
      ...prev,
      { titleId: Number(title.id), name: title.name, values: [] },
    ]);
  };

  const handleRemoveGroup = (titleId: string) => {
    setAttributeGroups((prev) => prev.filter((g) => String(g.titleId) !== String(titleId)));
  };

  const handleAddValue = (titleId: string, valueId: string) => {
    const poolValues = attributeValuePool[titleId] ?? [];
    const found = poolValues.find((v) => String(v.id) === String(valueId));
    if (!found) return;

    setAttributeGroups((prev) =>
      prev.map((g) =>
        String(g.titleId) !== String(titleId) ? g : { ...g, values: [...g.values, found] },
      ),
    );
  };

  const handleRemoveValue = (titleId: string, valueId: string) => {
    setAttributeGroups((prev) =>
      prev.map((g) =>
        String(g.titleId) !== String(titleId)
          ? g
          : { ...g, values: g.values.filter((v) => String(v.id) !== String(valueId)) },
      ),
    );
  };

  // ── Init ────────────────────────────────────────────────────
  const getInitialProductValue = () => {
    if (!initialValue) return { basePrice: undefined };
    return {
      ...initialValue,
      category_child: normalizeCategoryChild(initialValue.category_child),
      basePrice: initialValue.basePrice ?? initialValue.price,
    };
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleOk = async () => {
    const values = await form.validateFields();

    if (!attributeGroups.length) {
      form.setFields([{
        name: "attr_error",
        errors: ["Vui lòng chọn ít nhất 1 nhóm thuộc tính"],
      }]);
      return;
    }

    setIsSubmitting(true);
    try {
      const existingUrls = images.filter((img) => img.url).map((img) => img.url!);
      const filesToUpload = images.filter((img) => img.file).map((img) => img.file!);

      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await axiosClient.post("/product/upload-image", formData, {
          headers: {
            "Content-Type": undefined,
          },
        });
        if (uploadRes && uploadRes.imageUrl) {
          uploadedUrls.push(uploadRes.imageUrl);
        }
      }

      const finalImages = [...existingUrls, ...uploadedUrls];

      // Tạo variant_map: giữ lại stock cho tổ hợp cũ trùng khớp, tổ hợp mới set stock = 0
      const allCombos = generateAllCombinations(attributeGroups as any);
      const initVariantMap: VariantCombinationMap = {};
      const existingMap = initialValue?.variant_map ?? {};
      for (const ids of allCombos) {
        const key = generateCombinationKey(ids);
        initVariantMap[key] = { stock: existingMap[key]?.stock ?? 0 };
      }

      onOk({
        ...values,
        sku: tempParentSku,
        basePrice: Number(values.basePrice),
        attribute_groups: attributeGroups,
        variant_map: initVariantMap,
        image: finalImages,
      });
    } catch (err) {
      console.error(err);
      message.error(typeof err === "string" ? err : "Đã xảy ra lỗi khi tải ảnh lên, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <Modal
      title={isUpdate ? t("product.titleUpdate") : t("product.titleCreate")}
      width="min(860px, calc(100vw - 24px))"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={isSubmitting}
      afterOpenChange={(visible) => {
        if (!visible) return;
        isInitializingRef.current = true;
        form.resetFields();

        if (isUpdate && initialValue?.sku) {
          setTempParentSku(initialValue.sku);
        } else {
          setTempParentSku(generateUniqueParentSku("SP"));
        }

        form.setFieldsValue(getInitialProductValue());
        setAttributeGroups(initialValue?.attribute_groups ?? []);

        // Initialize image list
        const initialImages = getProductImages(initialValue?.image);
        setImages(initialImages.map((url, idx) => ({
          uid: `existing-${idx}-${url}`,
          url,
          previewUrl: url,
        })));

        setTimeout(() => { isInitializingRef.current = false; }, 0);
      }}
      afterClose={() => {
        form.resetFields();
        setAttributeGroups([]);
        setTempParentSku("");
        setImages([]);
        isInitializingRef.current = false;
      }}
      destroyOnHidden
      okText={isUpdate ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
      className="product-modal"
    >
      <Form form={form} layout="vertical">
        {/* ═══ PHẦN 1: THÔNG TIN CƠ BẢN ═══ */}
        <FormInput
          label={t("product.name")}
          name="name"
          required
          rules={[
            { required: true, message: t("product.validation.nameRequired") },
            { min: 3, message: t("product.validation.nameMin") },
            { max: 50, message: t("product.validation.nameMax") },
          ]}
        />

        {tempParentSku && (
          <Form.Item label={t("product.sku")}>
            <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
              {tempParentSku}
            </span>
          </Form.Item>
        )}

        <FormSelect
          label={t("product.category")}
          name="category"
          fieldNames={{ value: "id", label: "name" }}
          options={options}
          placeholder={t("product.selectCategory")}
          rules={[{ required: true, message: t("product.validation.categoryRequired") }]}
        />

        {selectedCategoryId && (
          <FormSelect
            label={t("product.categoryChild")}
            name="category_child"
            allowClear
            fieldNames={{ value: "id", label: "name" }}
            mode="multiple"
            options={optionsChild}
            placeholder={t("product.selectCategoryChild")}
          />
        )}

        <FormInput
          label={t("product.basePrice")}
          name="basePrice"
          type="number"
          min={0}
          rules={[{ required: true, message: t("product.validation.basePriceRequired") }]}
        />

        <Form.Item label={t("product.columns.image") || "Hình ảnh"}>
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              const isLt2M = file.size / 1024 / 1024 < 2;
              if (!isLt2M) {
                message.error(`${file.name} kích thước phải nhỏ hơn 2MB!`);
                return false;
              }
              const previewUrl = URL.createObjectURL(file);
              setImages((prev) => [
                ...prev,
                {
                  uid: `new-${Date.now()}-${Math.random()}`,
                  file,
                  previewUrl,
                },
              ]);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Chọn nhiều ảnh</Button>
          </Upload>
          {images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
              {images.map((item) => (
                <div
                  key={item.uid}
                  style={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <AntdImage
                    src={item.previewUrl}
                    width={100}
                    height={100}
                    style={{ objectFit: "cover" }}
                  />
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      zIndex: 10,
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      setImages((prev) => prev.filter((img) => img.uid !== item.uid));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        {/* ═══ PHẦN 2: CHỌN THUỘC TÍNH TỪ POOL ═══ */}
        <Divider orientation={"left" as any} style={{ margin: "16px 0 8px" }}>
          <TagsOutlined /> Chọn thuộc tính từ pool
        </Divider>

        {attributeTitles.length === 0 ? (
          <div
            style={{
              background: "#fffbe6",
              border: "1px solid #ffe58f",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              color: "#ad6800",
            }}
          >
            ⚠️ Chưa có nhóm thuộc tính nào trong pool.{" "}
            <a href="/attribute-management" target="_blank" rel="noopener noreferrer">
              Vào trang Attribute Pool →
            </a>{" "}
            để thêm trước.
          </div>
        ) : (
          <>
            {/* Chọn thêm nhóm */}
            {availableTitles.length > 0 && (
              <Form.Item style={{ marginBottom: 12 }}>
                <Select
                  placeholder={<><PlusOutlined /> Thêm nhóm thuộc tính...</>}
                  style={{ width: 240 }}
                  value={null}
                  onChange={handleAddGroup}
                  options={availableTitles.map((t) => ({ value: t.id, label: t.name }))}
                />
              </Form.Item>
            )}

            {/* Các nhóm đã chọn */}
            {attributeGroups.map((group) => {
              const poolValues = attributeValuePool[group.titleId] ?? [];
              const usedValueIds = new Set(group.values.map((v) => v.id));
              const availableValues = poolValues.filter((v) => !usedValueIds.has(v.id));

              return (
                <div key={group.titleId} className="attribute-group-card">
                  <div className="attribute-group-header">
                    <span className="attribute-group-title">{group.name}</span>
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => handleRemoveGroup(String(group.titleId))}
                    >
                      Bỏ nhóm này
                    </Button>
                  </div>

                  <div className="attribute-values-list">
                    {group.values.length === 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Chưa chọn giá trị nào.
                      </Text>
                    )}
                    {group.values.map((val) => (
                      <Tooltip
                        key={val.id}
                        title={val.price_modifier_amount !== 0
                          ? `± ${formatCurrency(val.price_modifier_amount)}`
                          : "Không đổi giá"}
                      >
                        <Tag
                          closable
                          color="blue"
                          onClose={() => handleRemoveValue(String(group.titleId), String(val.id))}
                        >
                          {val.value}
                        </Tag>
                      </Tooltip>
                    ))}

                    {availableValues.length > 0 && (
                      <Select
                        size="small"
                        placeholder={<><PlusOutlined /> Chọn từ pool</>}
                        style={{ width: 160 }}
                        value={null}
                        onChange={(valueId: string) => handleAddValue(String(group.titleId), valueId)}
                        options={availableValues.map((v) => ({
                          value: String(v.id),
                          label: `${v.value}${v.price_modifier_amount !== 0 ? ` (${v.price_modifier_amount > 0 ? "+" : ""}${(v.price_modifier_amount / 1000).toFixed(0)}k)` : ""}`,
                        }))}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Validation error placeholder */}
            <Form.Item name="attr_error" style={{ margin: 0 }} />
          </>
        )}

        {/* ═══ PHẦN 3: PREVIEW TỔ HỢP SẼ TẠO ═══ */}
        {previewCombinations.length > 0 && (
          <>
            <Divider orientation={"left" as any} style={{ margin: "16px 0 8px" }}>
              👁️ Preview tổ hợp ({generateAllCombinations(attributeGroups as any).length} tổ hợp)
            </Divider>
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 8,
                padding: "10px 16px",
              }}
            >
              <Space wrap size={6}>
                {previewCombinations.map((combo) => (
                  <Tag key={combo.key} color="green">
                    {combo.labels.join(" / ")}
                    {" · "}
                    {formatCurrency(combo.price)}
                  </Tag>
                ))}
                {generateAllCombinations(attributeGroups as any).length > 8 && (
                  <Tag>+{generateAllCombinations(attributeGroups as any).length - 8} tổ hợp khác</Tag>
                )}
              </Space>
              <div style={{ marginTop: 8, fontSize: 12, color: "#52c41a" }}>
                ✅ Tất cả tổ hợp sẽ được tạo với stock = 0. Nhập stock tại trang{" "}
                <strong>Quản lý thuộc tính theo sản phẩm</strong>.
              </div>
            </div>
          </>
        )}

        <FormInput
          label={t("product.description")}
          name="description"
          textarea
        />
      </Form>
    </Modal>
  );
};
