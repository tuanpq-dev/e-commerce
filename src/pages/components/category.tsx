import { Flex, Grid, Space, Table } from "antd";
import type React from "react";
import type { TableProps } from "antd";
import type { CategoryType } from "../../types/domain";
import {
  CreateCategory,
  DeleteCategory,
  UpdateCategory,
} from "../../api/categoryApi";
import { ModalCategory } from "../modal";
import { useState, useCallback, useEffect } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import openNotification from "../../@crema/core/Notification";
import AntButton from "../../@crema/component/AntButton";
import { useSearchParams } from "react-router-dom";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 5;

const Category: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { userInfo } = useAuth();
  const [rowData, setRowData] = useState<CategoryType>();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isOpenModalChild, setIsOpenModalChild] = useState(false);
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalItems, setTotalItems] = useState(0);
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;

  const fetchAllCategories = useCallback(async () => {
    try {
      const { data, meta } = await axiosClient.post('/category/search', {
        page: currentPage,
        pageSize
      });

      const processed = (data ?? []).map((parent: CategoryType) => {
        const children = parent.children?.map((child: CategoryType) => ({
          ...child,
          parentId: parent.id,
          children: undefined,
        })) ?? [];
        return {
          ...parent,
          children: children.length > 0 ? children : undefined,
        };
      });
      setTotalItems(meta.totalItems)
      setCategories(processed);
    } catch (err) {
      console.error(err);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleAdd = () => {
    setIsOpenModal(true);
    setIsUpdate(false);
    setRowData({});
  };

  const handleAddChild = () => {
    setIsOpenModalChild(true);
    setIsUpdate(false);
    setRowData({});
  };

  const handleCancel = () => {
    setIsOpenModal(false);
    setIsOpenModalChild(false);
    setIsOpenModalDelete(false);
  };

  const handleDelete = async () => {
    if (!rowData?.id) return;

    const hasChildren =
      (rowData?.children && rowData.children.length > 0) ||
      (rowData?.child && rowData.child.length > 0);

    if (hasChildren) {
      openNotification("error", {
        message: t("common.failed"),
        description: t("category.notification.deleteParentHasChildren"),
      });
      return;
    }

    try {
      await DeleteCategory(rowData.id);

      await CreateActiveLog({
        module: "Category",
        action: "DELETE",
        userName: userInfo?.fullname || "",
        userRole: userInfo?.role,
        userId: Number(userInfo?.id),
        payload: { id: rowData.id, name: rowData.name },
      });

      await Promise.all([fetchAllCategories()]);

      setIsOpenModalDelete(false);

      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.deleteSuccess"),
      });
    } catch (error) {
      console.log(error);

      openNotification("error", {
        message: t("common.failed"),
        description: t("category.notification.deleteFailed"),
      });
    }
  };

  const handleUpdate = (values: CategoryType) => {
    setRowData(values);
  };

  const columns: TableProps<CategoryType>["columns"] = [
    {
      title: t("category.columns.no"),
      fixed: !isMobile ? "start" : false,
      width: 20,
      render: (_value, record, index) =>
        record.parentId ? "" : (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t("category.columns.name"),
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: !isMobile ? "start" : false,
    },
    {
      title: t("category.columns.childCount"),
      dataIndex: "category_child",
      key: "category_child",
      width: 100,
      render: (_, record) => {
        return record.parentId ? "-" : (record.children ? record.children.length : 0);
      },
    },
    {
      title: t("category.columns.totalProduct"),
      dataIndex: "total",
      key: "total",
      width: 100,
    },
    {
      title: t("category.columns.action"),
      key: "action",
      fixed: !isMobile ? "end" : false,
      width: 100,
      align: "center",
      render: (_, record) => {
        return (
          <>
            <Space size="medium">
              <AntButton
                tooltip={t("common.update")}
                icon={<EditOutlined />}
                onClick={() => {
                  handleUpdate(record);
                  setIsUpdate(true);
                }}
              />

              <AntButton
                danger
                tooltip={t("common.delete")}
                icon={<DeleteOutlined />}
                onClick={() => {
                  setIsOpenModalDelete(true);
                  setRowData(record);
                }}
              />
            </Space>
          </>
        );
      },
    },
  ];

  const handleOk = async (values: CategoryType) => {
    if (isUpdate) {
      if (!rowData?.id) {
        return;
      }

      const updateValues = { id: rowData.id, ...values };

      await Promise.all([
        UpdateCategory(updateValues),
        CreateActiveLog({
          module: "Category",
          action: "UPDATE",
          userName: userInfo?.fullname || "",
          userRole: userInfo?.role,
          userId: Number(userInfo?.id),
          payload: updateValues,
        }),
      ]);

      await Promise.all([fetchAllCategories()]);
      setIsOpenModal(false);
      setIsUpdate(false);
      setRowData({});

      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.updateParentSuccess"),
      });
    } else {
      await Promise.all([CreateCategory(values)]);
      await CreateActiveLog({
        module: "Category",
        action: `CREATE - ${values.name}`,
        userName: userInfo?.fullname || "",
        userRole: userInfo?.role,
        userId: Number(userInfo?.id),
        payload: values,
      });
      await Promise.all([fetchAllCategories()]);
      setIsOpenModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.createParentSuccess"),
      });
    }
  };

  const handleOkChild = async (values: CategoryType) => {
    try {
      await CreateCategory({ name: values.name, parentId: values.parentId });
      await CreateActiveLog({
        module: "Category",
        action: `CREATE child - ${values.name}`,
        userName: userInfo?.fullname || "",
        userRole: userInfo?.role,
        userId: Number(userInfo?.id),
        payload: values,
      });
      await fetchAllCategories();
      setIsOpenModalChild(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.createChildSuccess") || "Thêm danh mục con thành công!",
      });
    } catch (err) {
      openNotification("error", {
        message: t("common.failed"),
        description: typeof err === "string" ? err : "Thêm danh mục con thất bại!",
      });
    }
  };

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <div className="page-toolbar-actions">
            <AntButton
              tooltip={t("common.add")}
              type="primary"
              onClick={handleAddChild}
            >
              {t("category.addChild")}
            </AntButton>
            <AntButton
              tooltip={t("common.add")}
              type="primary"
              onClick={handleAdd}
            >
              {t("category.addParent")}
            </AntButton>
          </div>
        </div>
        <div className="table-shell">
          <Table<CategoryType>
            rowKey="id"
            columns={columns}
            dataSource={categories}
            expandable={{
              expandIconColumnIndex: 1,
              rowExpandable: (record) => !!record.children && record.children.length > 0,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: ["2", "5", "10", "20", "50"],
              showTotal: (total, range) =>
                t("category.pagination", { count: range[1] - range[0] + 1, total }),
              onChange: (page, pageSize) => {
                setSearchParams({
                  _page: String(page),
                  _per_page: String(pageSize),
                });
              },
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Flex>

      <ModalCategory
        initialValue={rowData}
        open={isOpenModal}
        onOk={handleOk}
        onCancel={handleCancel}
        isUpdate={isUpdate}
      />

      <ModalCategory
        open={isOpenModalChild}
        onOk={handleOkChild}
        onCancel={handleCancel}
        parentOptions={categories}
      />

      <ModalConfirm
        open={isOpenModalDelete}
        onOk={handleDelete}
        onCancel={handleCancel}
        targetName={rowData?.name}
      />
    </>
  );
};

export default Category;
