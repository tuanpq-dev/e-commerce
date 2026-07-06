import React, { useMemo } from "react";
import { Flex, Form, Modal, Input } from "antd";
import type { FormInstance } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  CreateOrderValues,
  CustomerType,
  DataType,
  AttributeGroup,
} from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";
import AntButton from "../../@crema/component/AntButton";
import formatCurrency from "../../utils/formatCurrecy";
import { useTranslation } from "react-i18next";
import { generateCombinationKey } from "../../utils/variantEngine";

type ModalCartProps = {
  open: boolean;
  loading?: boolean;
  optionsLoading?: boolean;
  customers: CustomerType[];
  products: DataType[];
  onCancel: () => void;
  onOk: (values: CreateOrderValues) => void;
};

type OrderItemFieldProps = {
  form: FormInstance;
  fieldName: number;
  restField: Record<string, unknown>;
  products: DataType[];
  optionsLoading?: boolean;
  canRemove: boolean;
  onRemove: () => void;
};

const DEFAULT_SHIPPING_ADDRESS = "48 - Sơn Thanh - Xã Phú Xuyên - Hà Nội";

const getCustomerShippingAddress = (
  customers: CustomerType[],
  customerId?: string | number,
) => {
  const customer = customers.find(
    (item) => String(item.id) === String(customerId),
  );
  const address = customer?.address?.trim();

  return address || DEFAULT_SHIPPING_ADDRESS;
};

const getOrderProductVariants = (product?: DataType) => {
  if (!product) {
    return [];
  }

  if (product.variants?.length) {
    return product.variants;
  }

  return [
    {
      size: "Default",
      color: "Default",
      price: product.price,
      stock: product.stock,
      sku: product.sku,
    },
  ];
};

const findOrderProduct = (products: DataType[], productId?: string | number) =>
  products.find((product) => String(product.id) === String(productId));

const getProductAttributeGroups = (product?: DataType): AttributeGroup[] => {
  if (!product) return [];
  if (product.attribute_groups?.length) {
    return product.attribute_groups;
  }
  // Construct virtual attribute groups for legacy products
  const variants = product.variants ?? [];
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const uniqueColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));

  const groups: AttributeGroup[] = [];
  if (uniqueSizes.length) {
    groups.push({
      titleId: "size",
      name: "Size",
      values: uniqueSizes.map((size) => ({
        id: size,
        value: size,
        price_modifier_amount: 0,
      })),
    });
  }
  if (uniqueColors.length) {
    groups.push({
      titleId: "color",
      name: "Màu",
      values: uniqueColors.map((color) => ({
        id: color,
        value: color,
        price_modifier_amount: 0,
      })),
    });
  }
  return groups;
};

const findOrderVariant = (
  products: DataType[],
  item?: {
    product_id?: string | number;
    attributes?: Record<string, string>;
  },
) => {
  const product = findOrderProduct(products, item?.product_id);
  if (!product) return undefined;

  const attributeGroups = getProductAttributeGroups(product);
  const selectedAttrs = item?.attributes ?? {};

  // Check if all active attributes of this product have been selected
  const allSelected = attributeGroups.every((g) => !!selectedAttrs[g.titleId]);
  if (!allSelected) return undefined;

  // New dynamic N-attribute system
  if (product.variant_map && Object.keys(product.variant_map).length > 0) {
    // Get the selected value IDs (excluding any virtual attributes)
    const valueIds = attributeGroups
      .map((g) => selectedAttrs[g.titleId])
      .filter(Boolean);

    const comboKey = generateCombinationKey(valueIds);
    const stockData = product.variant_map[comboKey ?? ""];

    // If combination is not found, treat it as stock = 0
    const stock = stockData ? stockData.stock : 0;

    // Calculate final price: basePrice + sum of modifiers
    const basePrice = Number(product.basePrice ?? product.price ?? 0);
    let price = basePrice;
    if (product.attribute_groups) {
      const modifierMap = new Map<string, number>();
      for (const g of product.attribute_groups) {
        for (const v of g.values) {
          modifierMap.set(v.id, v.price_modifier_amount);
        }
      }
      price += valueIds.reduce((sum, id) => sum + (modifierMap.get(id) ?? 0), 0);
    }

    // Build label string
    const labelMap = new Map<string, string>();
    if (product.attribute_groups) {
      for (const g of product.attribute_groups) {
        for (const v of g.values) {
          labelMap.set(v.id, v.value);
        }
      }
    }
    const labelStr = valueIds.map((id) => labelMap.get(id) ?? id).join(" / ");

    return {
      size: labelStr,
      color: "Default",
      price: price,
      stock: stock,
      sku: product.sku,
      comboKey: comboKey,
      isOutOfStock: stock <= 0,
    };
  }

  // Legacy system
  const size = selectedAttrs["size"];
  const color = selectedAttrs["color"];
  const variant = (product.variants ?? []).find(
    (v) => String(v.size) === String(size) && String(v.color) === String(color),
  );

  if (!variant) return undefined;

  return {
    size: variant.size,
    color: variant.color,
    price: Number(variant.price),
    stock: Number(variant.stock),
    sku: variant.sku ?? product.sku,
    isOutOfStock: Number(variant.stock) <= 0,
  };
};

const getOrderTotalPrice = (
  products: DataType[],
  items?: {
    product_id?: string | number;
    attributes?: Record<string, string>;
    quantity?: string | number;
  }[],
) =>
  (items ?? []).reduce((total, item) => {
    const variant = findOrderVariant(products, item);

    return total + Number(variant?.price ?? 0) * Number(item.quantity ?? 0);
  }, 0);

const OrderItemFieldComponent = ({
  form,
  fieldName,
  restField,
  products,
  optionsLoading,
  canRemove,
  onRemove,
}: OrderItemFieldProps) => {
  const { t } = useTranslation();
  const productCurrent = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products],
  );

  // 2. Watch values of current row via Form.useWatch
  const productId = Form.useWatch(["items", fieldName, "product_id"], form);
  const selectedAttributes = Form.useWatch(["items", fieldName, "attributes"], form);
  const quantity = Form.useWatch(["items", fieldName, "quantity"], form);

  // Find currently selected product
  const product = useMemo(
    () => findOrderProduct(productCurrent, productId),
    [productCurrent, productId],
  );

  // Compute active attribute groups for dynamic rendering
  const attributeGroups = useMemo(() => getProductAttributeGroups(product), [product]);

  // Find currently matched variant (stock & price)
  const variant = useMemo(
    () =>
      findOrderVariant(productCurrent, {
        product_id: productId,
        attributes: selectedAttributes,
      }),
    [productCurrent, productId, selectedAttributes],
  );

  const rowTotal = Number(variant?.price ?? 0) * Number(quantity ?? 0);

  return (
    <div className="order-item-row">
      {/* Product Select */}
      <FormSelect
        {...restField}
        label={t("order.product")}
        name={[fieldName, "product_id"]}
        showSearch
        loading={optionsLoading}
        disabled={optionsLoading}
        options={productCurrent.map((item) => ({
          label: item.name,
          value: item.id,
        }))}
        onChange={(val) => {
          const selectedProd = productCurrent.find(
            (p) => String(p.id) === String(val),
          );
          const groups = getProductAttributeGroups(selectedProd);

          // Default: Pre-select first value for each attribute group
          const defaultAttributes: Record<string, string> = {};
          groups.forEach((g) => {
            if (g.values.length > 0) {
              defaultAttributes[g.titleId] = g.values[0].id;
            }
          });

          form.setFieldValue(["items", fieldName, "attributes"], defaultAttributes);
          form.setFieldValue(["items", fieldName, "quantity"], 1);
          form.validateFields([["items", fieldName, "quantity"]]);
        }}
        rules={[
          { required: true, message: t("order.validation.productRequired") },
        ]}
      />

      {/* Dynamic Attributes Container */}
      <div className="order-item-attributes-container">
        {attributeGroups.map((group) => (
          <FormSelect
            key={group.titleId}
            {...restField}
            label={group.name}
            name={[fieldName, "attributes", group.titleId]}
            options={group.values.map((val) => ({
              label: val.value,
              value: val.id,
            }))}
            onChange={() => {
              form.validateFields([["items", fieldName, "quantity"]]);
            }}
            rules={[
              {
                required: true,
                message: `Chọn ${group.name.toLowerCase()}`,
              },
            ]}
          />
        ))}

        {/* Fallback place-holders if no product selected to keep grid intact */}
        {attributeGroups.length === 0 && (
          <>
            <FormSelect
              {...restField}
              label={t("order.size")}
              name={[fieldName, "attributes", "size"]}
              disabled
              options={[]}
            />
            <FormSelect
              {...restField}
              label={t("order.color")}
              name={[fieldName, "attributes", "color"]}
              disabled
              options={[]}
            />
          </>
        )}
      </div>

      {/* Quantity Input */}
      <FormInput
        {...restField}
        label={t("order.quantity")}
        name={[fieldName, "quantity"]}
        type="number"
        min={0}
        rules={[
          { required: true, message: t("order.validation.quantityRequired") },
          {
            validator: async (_, value) => {
              const currentQuantity = Number(value);

              if (currentQuantity < 1) {
                throw new Error(t("order.validation.quantityMin"));
              }

              // Must select all attributes
              const allSelected = attributeGroups.every(
                (g) => selectedAttributes && !!selectedAttributes[g.titleId],
              );
              if (!allSelected || !variant) {
                throw new Error("Vui lòng chọn đầy đủ thuộc tính");
              }

              if (variant.isOutOfStock || variant.stock < 1) {
                throw new Error("Hết hàng");
              }

              if (currentQuantity > Number(variant.stock)) {
                throw new Error(
                  t("order.validation.stockLimit", { stock: variant.stock }),
                );
              }
            },
          },
        ]}
      />

      {/* Info Panel */}
      <Form.Item label={t("order.info")}>
        <div className="order-item-summary">
          <span>
            {t("order.unitPrice")}:{" "}
            {formatCurrency(Number(variant?.price ?? 0))}
          </span>
          <span>
            {t("order.stock")}: {variant?.isOutOfStock ? "Hết hàng" : (variant?.stock ?? 0)}
          </span>
          <strong>
            {t("order.subtotal")}: {formatCurrency(rowTotal)}
          </strong>
        </div>
      </Form.Item>

      {/* Remove Button */}
      <Form.Item label=" ">
        <AntButton
          danger
          icon={<DeleteOutlined />}
          disabled={!canRemove}
          onClick={onRemove}
          className="order-item-remove"
        />
      </Form.Item>
    </div>
  );
};

const OrderItemField = React.memo(
  OrderItemFieldComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.fieldName === nextProps.fieldName &&
      prevProps.optionsLoading === nextProps.optionsLoading &&
      prevProps.canRemove === nextProps.canRemove &&
      prevProps.products === nextProps.products
    );
  },
);

export const ModalCart = ({
  open,
  loading,
  optionsLoading,
  customers,
  products,
  onCancel,
  onOk,
}: ModalCartProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const orderItems = Form.useWatch("items", form);
  const orderTotal = useMemo(
    () => getOrderTotalPrice(products, orderItems),
    [orderItems, products],
  );

  return (
    <Modal
      title={t("order.title")}
      width="min(1120px, calc(100vw - 24px))"
      open={open}
      confirmLoading={loading}
      onOk={async () => {
        const values = await form.validateFields();
        onOk(values);
      }}
      onCancel={onCancel}
      afterOpenChange={(visible) => {
        if (!visible) return;
        form.resetFields();
        form.setFieldsValue({
          items: [{ quantity: 1 }],
          payment_method: "cod",
          shipping_address: DEFAULT_SHIPPING_ADDRESS,
        });
      }}
      afterClose={() => form.resetFields()}
      okText={t("common.add")}
      cancelText={t("common.cancel")}
      destroyOnHidden
      className="product-modal"
    >
      <Form form={form} layout="vertical">
        <FormSelect
          label={t("order.customer")}
          name="customer_id"
          showSearch
          loading={optionsLoading}
          disabled={optionsLoading}
          options={customers.map((customer) => ({
            label: `${customer.fullname} - ${customer.email}`,
            value: customer.id,
          }))}
          onChange={(customerId) => {
            form.setFieldsValue({
              shipping_address: getCustomerShippingAddress(
                customers,
                customerId,
              ),
            });
          }}
          rules={[
            { required: true, message: t("order.validation.customerRequired") },
          ]}
        />
        <Form.List
          name="items"
          rules={[
            {
              validator: async (_, items) => {
                if (!items?.length) {
                  throw new Error(t("order.validation.min1Product"));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <Flex vertical gap="small">
              <div className="order-items-header">
                <strong>{t("order.productsInOrder")}</strong>
                <AntButton
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ quantity: 1 })}
                >
                  {t("order.addProduct")}
                </AntButton>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <OrderItemField
                  key={key}
                  form={form}
                  fieldName={name}
                  restField={restField}
                  products={products}
                  optionsLoading={optionsLoading}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(name)}
                />
              ))}
              <Form.ErrorList errors={errors} />
            </Flex>
          )}
        </Form.List>
        <FormSelect
          label={t("order.paymentMethod")}
          name="payment_method"
          options={[
            { label: "Momo", value: "momo" },
            { label: "COD", value: "cod" },
            { label: "QR", value: "qr" },
          ]}
          rules={[
            {
              required: true,
              message: t("order.validation.paymentRequired"),
            },
          ]}
        />
        <FormInput
          label={t("order.shippingAddress")}
          name="shipping_address"
          rules={[
            { required: true, message: t("order.validation.addressRequired") },
            { max: 100, message: t("order.validation.addressMax") },
          ]}
        />
        <FormInput
          label={t("order.note")}
          name="note"
          textarea
          rules={[{ max: 200, message: t("order.validation.noteMax") }]}
        />
        <div className="order-total-row">
          <span>{t("order.totalPrice")}</span>
          <strong>{formatCurrency(orderTotal)}</strong>
        </div>
      </Form>
    </Modal>
  );
};
