import React, { useMemo } from "react";
import { Button, Divider, Form, Select, Tag, Tooltip, Typography } from "antd";
import { PlusOutlined, TagsOutlined, ThunderboltOutlined, EyeOutlined, CheckCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { AttributeGroup, AttributeTitle, AttributeValueItem } from "../../types/domain";
import { generateAllCombinations, generateCombinationKey } from "../../utils/variantEngine";
import formatCurrency from "../../utils/formatCurrecy";

const { Text } = Typography;

interface ProductAttributeSelectorProps {
  attributeTitles: AttributeTitle[];
  attributeValuePool: Record<string, AttributeValueItem[]>;
  attributeGroups: AttributeGroup[];
  setAttributeGroups: React.Dispatch<React.SetStateAction<AttributeGroup[]>>;
  watchedBasePrice: number | string | undefined;
  isGenerated: boolean;
  setIsGenerated: (value: boolean) => void;
  excludedKeys: Set<string>;
  setExcludedKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const ProductAttributeSelector: React.FC<ProductAttributeSelectorProps> = ({
  attributeTitles,
  attributeValuePool,
  attributeGroups,
  setAttributeGroups,
  watchedBasePrice,
  isGenerated,
  setIsGenerated,
  excludedKeys,
  setExcludedKeys,
}) => {
  const { t } = useTranslation();

  const usedTitleIds = new Set(attributeGroups.map((g) => String(g.titleId)));
  const availableTitles = attributeTitles.filter((t) => !usedTitleIds.has(String(t.id)));

  const handleAddGroup = (titleId: string) => {
    if (usedTitleIds.has(String(titleId))) return;

    const title = attributeTitles.find((t) => String(t.id) === String(titleId));
    if (!title) return;

    const poolValues = attributeValuePool[titleId] ?? attributeValuePool[Number(titleId)] ?? [];

    setAttributeGroups((prev) => [
      ...prev,
      {
        titleId: Number(title.id),
        name: title.name,
        values: [...poolValues],
      },
    ]);
    setIsGenerated(false);
    setExcludedKeys(new Set());
  };

  const handleRemoveGroup = (titleId: string) => {
    setAttributeGroups((prev) => prev.filter((g) => String(g.titleId) !== String(titleId)));
    setIsGenerated(false);
    setExcludedKeys(new Set());
  };

  const handleAddValue = (titleId: string, valueId: string) => {
    const poolValues = attributeValuePool[titleId] ?? attributeValuePool[Number(titleId)] ?? [];
    const found = poolValues.find((v) => String(v.id) === String(valueId));
    if (!found) return;

    setAttributeGroups((prev) =>
      prev.map((g) =>
        String(g.titleId) !== String(titleId)
          ? g
          : { ...g, values: [...g.values, found] },
      ),
    );
    setIsGenerated(false);
    setExcludedKeys(new Set());
  };

  const handleRemoveValue = (titleId: string, valueId: string) => {
    setAttributeGroups((prev) =>
      prev.map((g) =>
        String(g.titleId) !== String(titleId)
          ? g
          : { ...g, values: g.values.filter((v) => String(v.id) !== String(valueId)) },
      ),
    );
    setIsGenerated(false);
    setExcludedKeys(new Set());
  };

  const handleGenerate = () => {
    setExcludedKeys(new Set());
    setIsGenerated(true);
  };

  const totalCombinations = useMemo(() => {
    if (!attributeGroups.length) return 0;
    const allCombos = generateAllCombinations(attributeGroups as any);
    return allCombos.filter((ids) => {
      const key = generateCombinationKey(ids);
      return !excludedKeys.has(key);
    }).length;
  }, [attributeGroups, excludedKeys]);

  const previewCombinations = useMemo(() => {
    if (!isGenerated || !attributeGroups.length) return [];
    const allCombos = generateAllCombinations(attributeGroups as any);
    const validCombos = allCombos.filter((ids) => {
      const key = generateCombinationKey(ids);
      return !excludedKeys.has(key);
    });
    const basePrice = Number(watchedBasePrice) || 0;

    const valueLabel = new Map<string, string>();
    const valueModifier = new Map<string, number>();
    for (const g of attributeGroups) {
      for (const v of g.values) {
        valueLabel.set(String(v.id), v.value);
        valueModifier.set(String(v.id), v.price_modifier_amount);
      }
    }

    return validCombos.slice(0, 8).map((ids) => {
      const key = generateCombinationKey(ids);
      const labels = ids.map((id) => valueLabel.get(id) ?? id);
      const price = basePrice + ids.reduce((s, id) => s + (valueModifier.get(id) ?? 0), 0);
      return { key, labels, price };
    });
  }, [isGenerated, attributeGroups, watchedBasePrice, excludedKeys]);

  const hasEmptyGroup = attributeGroups.some((g) => g.values.length === 0);

  return (
    <>
      <Divider titlePlacement="left" className="product-divider">
        <TagsOutlined /> {t("product.attributes.sectionTitle")}
      </Divider>

      {attributeTitles.length === 0 ? (
        <div className="attribute-pool-warning">
          {t("product.attributes.poolEmpty")}{" "}
          <a href="/attribute-management" target="_blank" rel="noopener noreferrer">
            {t("product.attributes.goToPool")}
          </a>
        </div>
      ) : (
        <>
          {availableTitles.length > 0 && (
            <Form.Item className="attribute-group-add-form-item">
              <Select
                placeholder={
                  <>
                    <PlusOutlined /> {t("product.attributes.addGroupPlaceholder")}
                  </>
                }
                className="attribute-group-select"
                value={null}
                onChange={handleAddGroup}
                options={availableTitles.map((t) => ({ value: String(t.id), label: t.name }))}
              />
            </Form.Item>
          )}

          {attributeGroups.map((group) => {
            const poolValues = attributeValuePool[group.titleId] ?? attributeValuePool[String(group.titleId)] ?? [];
            const usedValueIds = new Set(group.values.map((v) => String(v.id)));
            const availableValues = poolValues.filter((v) => !usedValueIds.has(String(v.id)));

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
                    {t("product.attributes.removeGroup")}
                  </Button>
                </div>

                <div className="attribute-values-list">
                  {group.values.length === 0 && (
                    <Text type="secondary" className="attribute-empty-text">
                      {t("product.attributes.noValuesSelected")}
                    </Text>
                  )}
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
                        onClose={() => handleRemoveValue(String(group.titleId), String(val.id))}
                      >
                        {val.value}
                      </Tag>
                    </Tooltip>
                  ))}

                  {availableValues.length > 0 && (
                    <Select
                      size="small"
                      placeholder={
                        <>
                          <PlusOutlined /> {t("product.attributes.selectFromPool")}
                        </>
                      }
                      className="attribute-value-select"
                      value={null}
                      onChange={(valueId: string) => handleAddValue(String(group.titleId), valueId)}
                      options={availableValues.map((v) => ({
                        value: String(v.id),
                        label: `${v.value}${
                          v.price_modifier_amount !== 0
                            ? ` (${v.price_modifier_amount > 0 ? "+" : ""}${(
                                v.price_modifier_amount / 1000
                              ).toFixed(0)}k)`
                            : ""
                        }`,
                      }))}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {attributeGroups.length > 0 && (
            <div className="attribute-generate-btn-container">
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerate}
                disabled={hasEmptyGroup}
                className="generate-combos-btn"
              >
                {t("product.attributes.generateCombinations")}
              </Button>
            </div>
          )}

          <Form.Item name="attr_error" className="attribute-error-item" style={{ marginBottom: 0 }}>
            <span />
          </Form.Item>
        </>
      )}

      {isGenerated && totalCombinations > 0 && (
        <div className="combination-preview-container">
          <div className="combination-preview-header">
            <div className="combination-preview-title">
              <EyeOutlined className="preview-title-icon" />
              {t("product.attributes.previewTitle", { count: totalCombinations })}
            </div>
            <span className="combination-count-badge">
              {totalCombinations} tổ hợp
            </span>
          </div>

          <div className="combination-preview-grid">
            {previewCombinations.map((combo) => (
              <div key={combo.key} className="combination-card">
                <div className="combo-card-header">
                  <div className="combo-labels">
                    {combo.labels.map((lbl, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="combo-label-separator">/</span>}
                        <span className="combo-tag-pill">{lbl}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  <Tooltip title={t("common.delete") || "Xóa tổ hợp này"}>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      className="combo-card-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExcludedKeys((prev) => new Set(prev).add(combo.key));
                      }}
                    />
                  </Tooltip>
                </div>
                <div className="combo-price">
                  {formatCurrency(combo.price)}
                </div>
              </div>
            ))}

            {totalCombinations > 8 && (
              <div className="combination-more-card">
                +{totalCombinations - 8} tổ hợp khác
              </div>
            )}
          </div>

          <div className="combination-preview-note">
            <CheckCircleOutlined style={{ fontSize: 15, flexShrink: 0 }} />
            <span>{t("product.attributes.combinationNote")}</span>
          </div>
        </div>
      )}
    </>
  );
};


