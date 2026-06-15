import { useMemo } from "react";
import { Flex, Form, Modal } from "antd";
import type { FormInstance } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  CreateOrderValues,
  CustomerType,
  DataType,
} from "../../types/domain";
import FormInput from "../../@crema/core/Form/FormInput";
import FormSelect from "../../@crema/core/Form/FormSelect";
import AntButton from "../../@crema/component/AntButton";

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

const formatOrderCurrency = (value: number) =>
  `$ ${Number(value || 0).toLocaleString("en")} `;

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

const findOrderVariant = (
  products: DataType[],
  item?: {
    product_id?: string | number;
    size?: string;
    color?: string;
  },
) => {
  const product = findOrderProduct(products, item?.product_id);

  return getOrderProductVariants(product).find(
    (variant) =>
      String(variant.size) === String(item?.size) &&
      String(variant.color) === String(item?.color),
  );
};

const getOrderTotalPrice = (
  products: DataType[],
  items?: {
    product_id?: string | number;
    size?: string;
    color?: string;
    quantity?: string | number;
  }[],
) =>
  (items ?? []).reduce((total, item) => {
    const variant = findOrderVariant(products, item);

    return total + Number(variant?.price ?? 0) * Number(item.quantity ?? 0);
  }, 0);

const OrderItemField = ({
  form,
  fieldName,
  restField,
  products,
  optionsLoading,
  canRemove,
  onRemove,
}: OrderItemFieldProps) => {
  const productId = Form.useWatch(["items", fieldName, "product_id"], form);
  const selectedSize = Form.useWatch(["items", fieldName, "size"], form);
  const color = Form.useWatch(["items", fieldName, "color"], form);
  const quantity = Form.useWatch(["items", fieldName, "quantity"], form);
  const product = findOrderProduct(products, productId);
  const variants = getOrderProductVariants(product);
  const variant = findOrderVariant(products, {
    product_id: productId,
    size: selectedSize,
    color,
  });
  const sizeOptions = Array.from(
    new Set(variants.map((item) => item.size)),
  ).map((size) => ({
    label: size,
    value: size,
  }));
  const colorOptions = variants
    .filter((item) => !selectedSize || item.size === selectedSize)
    .map((item) => ({
      label: `${item.color} - tồn ${item.stock}`,
      value: item.color,
      disabled: Number(item.stock) <= 0,
    }));
  const rowTotal = Number(variant?.price ?? 0) * Number(quantity ?? 0);

  return (
    <div className="order-item-row">
      <FormSelect
        {...restField}
        label="Sản phẩm"
        name={[fieldName, "product_id"]}
        showSearch
        loading={optionsLoading}
        disabled={optionsLoading}
        optionFilterProp="label"
        options={products.map((item) => ({
          label: item.name,
          value: item.id,
        }))}
        onChange={() => {
          const items = form.getFieldValue("items") ?? [];
          items[fieldName] = {
            ...items[fieldName],
            size: undefined,
            color: undefined,
            quantity: 1,
          };
          form.setFieldsValue({ items });
        }}
        rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
      />
      <FormSelect
        {...restField}
        label="Size"
        name={[fieldName, "size"]}
        disabled={!productId || optionsLoading}
        options={sizeOptions}
        onChange={() => {
          const items = form.getFieldValue("items") ?? [];
          items[fieldName] = {
            ...items[fieldName],
            color: undefined,
          };
          form.setFieldsValue({ items });
        }}
        rules={[{ required: true, message: "Vui lòng chọn size" }]}
      />
      <FormSelect
        {...restField}
        label="Màu"
        name={[fieldName, "color"]}
        disabled={!productId || !selectedSize || optionsLoading}
        options={colorOptions}
        rules={[{ required: true, message: "Vui lòng chọn màu" }]}
      />
      <FormInput
        {...restField}
        label="Số lượng"
        name={[fieldName, "quantity"]}
        type="number"
        min={1}
        rules={[
          { required: true, message: "Vui lòng nhập số lượng" },
          {
            validator: async (_, value) => {
              const currentQuantity = Number(value);

              if (currentQuantity < 1) {
                throw new Error("Số lượng tối thiểu là 1");
              }

              if (variant && currentQuantity > Number(variant.stock)) {
                throw new Error(`Tồn kho còn ${variant.stock}`);
              }
            },
          },
        ]}
      />
      <div className="order-item-summary">
        <span>Đơn giá: {formatOrderCurrency(Number(variant?.price ?? 0))}</span>
        <span>Tồn kho: {variant?.stock ?? 0}</span>
        <strong>Tạm tính: {formatOrderCurrency(rowTotal)}</strong>
      </div>
      <AntButton
        danger
        icon={<DeleteOutlined />}
        disabled={!canRemove}
        onClick={onRemove}
        className="order-item-remove"
      />
    </div>
  );
};

export const ModalCart = ({
  open,
  loading,
  optionsLoading,
  customers,
  products,
  onCancel,
  onOk,
}: ModalCartProps) => {
  const [form] = Form.useForm();
  const orderItems = Form.useWatch("items", form);
  const orderTotal = useMemo(
    () => getOrderTotalPrice(products, orderItems),
    [orderItems, products],
  );

  return (
    <Modal
      title="Thêm mới đơn hàng"
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
      okText="Thêm mới"
      cancelText="Hủy"
      destroyOnHidden
      className="product-modal"
    >
      <Form form={form} layout="vertical">
        <FormSelect
          label="Khách hàng"
          name="customer_id"
          showSearch
          loading={optionsLoading}
          disabled={optionsLoading}
          optionFilterProp="label"
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
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        />
        <Form.List
          name="items"
          rules={[
            {
              validator: async (_, items) => {
                if (!items?.length) {
                  throw new Error("Vui lòng thêm ít nhất một sản phẩm");
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <Flex vertical gap="small">
              <div className="order-items-header">
                <strong>Sản phẩm trong đơn</strong>
                <AntButton
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ quantity: 1 })}
                >
                  Thêm sản phẩm
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
          label="Phương thức thanh toán"
          name="payment_method"
          options={[
            { label: "Momo", value: "momo" },
            { label: "COD", value: "cod" },
            { label: "QR", value: "qr" },
          ]}
          rules={[
            {
              required: true,
              message: "Vui lòng chọn phương thức thanh toán",
            },
          ]}
        />
        <FormInput
          label="Địa chỉ giao hàng"
          name="shipping_address"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
        />
        <FormInput label="Ghi chú" name="note" textarea />
        <div className="order-total-row">
          <span>Tổng tiền đơn hàng</span>
          <strong>{formatOrderCurrency(orderTotal)}</strong>
        </div>
      </Form>
    </Modal>
  );
};
