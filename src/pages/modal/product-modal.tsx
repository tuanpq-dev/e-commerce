import { useRef, useState } from "react";
import {
  Button,
  Form,
  Modal,
  Upload,
  Image as AntdImage,
  message,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
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
import axiosClient from "../../api/axiosClient";
import { ProductAttributeSelector } from "./product-attribute-selector";
import "./index.css";

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
  attributeTitles?: AttributeTitle[];
  attributeValuePool?: Record<string, AttributeValueItem[]>;
};

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
  const [isGenerated, setIsGenerated] = useState(false);
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const getInitialProductValue = () => {
    if (!initialValue) return { basePrice: undefined };
    return {
      ...initialValue,
      category_child: normalizeCategoryChild(initialValue.category_child),
      basePrice: initialValue.basePrice ?? initialValue.price,
    };
  };

  const handleOk = async () => {
    const values = await form.validateFields();

    if (!attributeGroups.length || !isGenerated) {
      form.setFields([{
        name: "attr_error",
        errors: [t("product.attributes.validationRequired")],
      }]);
      return;
    }

    const emptyGroup = attributeGroups.find((g) => !g.values.length);
    if (emptyGroup) {
      form.setFields([{
        name: "attr_error",
        errors: [t("product.attributes.validationNoValues", { name: emptyGroup.name })],
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

      const allCombos = generateAllCombinations(attributeGroups as any);
      const initVariantMap: VariantCombinationMap = {};
      const existingMap = initialValue?.variant_map ?? {};
      for (const ids of allCombos) {
        const key = generateCombinationKey(ids);
        if (excludedKeys.has(key)) continue;
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
        const initGroups = initialValue?.attribute_groups ?? [];
        setAttributeGroups(initGroups);
        setIsGenerated(!!(isUpdate && initGroups.length));
        setExcludedKeys(new Set());

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
        setIsGenerated(false);
        setExcludedKeys(new Set());
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
            <span className="product-sku-text">
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
            <div className="product-image-list">
              {images.map((item) => (
                <div key={item.uid} className="product-image-item">
                  <AntdImage
                    src={item.previewUrl}
                    width={100}
                    height={100}
                    className="product-image-preview"
                  />
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<DeleteOutlined />}
                    size="small"
                    className="product-image-delete-btn"
                    onClick={() => {
                      setImages((prev) => prev.filter((img) => img.uid !== item.uid));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        <FormInput
          label={t("product.description")}
          name="description"
          textarea
        />

        <ProductAttributeSelector
          attributeTitles={attributeTitles}
          attributeValuePool={attributeValuePool}
          attributeGroups={attributeGroups}
          setAttributeGroups={setAttributeGroups}
          watchedBasePrice={watchedBasePrice}
          isGenerated={isGenerated}
          setIsGenerated={setIsGenerated}
          excludedKeys={excludedKeys}
          setExcludedKeys={setExcludedKeys}
        />
      </Form>
    </Modal>
  );
};