import { Flex, Grid, Input, Space, Table } from "antd";
import type React from "react";
import type { TableProps } from "antd";
import type { CategoryType } from "../../types/domain";
import {
  CreateCategory,
  DeleteCategory,
  UpdateCategory,
} from "../../api/categoryApi";
import { ModalCategory, ModalCategoryChild } from "../modal";
import { useState, useCallback, useEffect } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import openNotification from "../../@crema/core/Notification";
import AntButton from "../../@crema/component/AntButton";
import {  useSearchParams } from "react-router-dom";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import useDebounce from "../../@crema/core/hook/useDebounce";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 5;

const Category: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { Search } = Input;
  const { userInfo } = useAuth();
  const [rowData, setRowData] = useState<CategoryType>();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isOpenModalChild, setIsOpenModalChild] = useState(false);
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const [category, setCategory] = useState<CategoryType[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryType[]>([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const searchQuery = searchParams.get("q") ?? "";

  // State quản lý giá trị đang gõ vào ô tìm kiếm (debounce 500ms)
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Khi URL thay đổi từ bên ngoài, đồng bộ lại input
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Khi debounce thay đổi, cập nhật URL params
  useEffect(() => {
    if (debouncedSearch.trim() !== searchQuery.trim()) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const keyword = debouncedSearch.trim();
        if (keyword) {
          next.set("q", keyword);
          next.set("_page", String(DEFAULT_PAGE));
        } else {
          next.delete("q");
          next.delete("_page");
        }
        return next;
      });
    }
  }, [debouncedSearch, searchQuery, setSearchParams]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const { data } = await axiosClient('/category/tree');
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
      setAllCategories(processed);
      setCategory(processed);
    } catch (err) {
      console.error(err);
    }
  }, []);

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

      // await CreateActiveLog({
      //   module: "Category",
      //   action: "DELETE",
      //   user: userInfo?.name ?? "Unknown",
      // });

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
                  if (record.parentId) {
                    setIsOpenModalChild(true);
                  } else {
                    setIsOpenModal(true);
                  }
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
          user: userInfo?.name,
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
      await Promise.all([
        CreateCategory(values),
      ]);
      await Promise.all([fetchAllCategories()]);

      setIsOpenModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.createParentSuccess"),
      });
    }
  };

  const handleOkChild = async (values: CategoryType) => {
    if (isUpdate) {
      if (!rowData?.id) {
        return;
      }
      await Promise.all([
        UpdateCategory({ id: rowData.id, ...values }),
      ]);
      await Promise.all([fetchAllCategories()]);
      setIsOpenModalChild(false);
      setIsUpdate(false);
      setRowData({});
      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.updateChildSuccess"),
      });
    } else {
      await Promise.all([
        CreateCategory(values),
      ]);
      await Promise.all([fetchAllCategories()]);
      setIsOpenModalChild(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.createChildSuccess"),
      });
    }
  };

  // Lọc dữ liệu cây danh mục theo ô tìm kiếm ở frontend
  const filteredCategory = category.filter((cat) => {
    const matchesParent = cat.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchedChildren = cat.children?.filter((child) =>
      child.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) ?? [];
    
    return !!(matchesParent || matchedChildren.length > 0);
  }).map((cat) => {
    const matchesParent = cat.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
    if (matchesParent) {
      return cat;
    }
    return {
      ...cat,
      children: cat.children?.filter((child) =>
        child.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) ?? [],
    };
  });

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <Search
            allowClear={true}
            placeholder={t("category.placeholder.search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="page-search"
          />
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
            dataSource={filteredCategory}
            expandable={{
              expandIconColumnIndex: 1,
              rowExpandable: (record) => !!record.children && record.children.length > 0,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredCategory.length,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              showTotal: (total, range) =>
                t("category.pagination", { count: range[1] - range[0] + 1, total }),
              onChange: (page, size) => {
                setSearchParams({
                  _page: String(page),
                  _per_page: String(size),
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

      <ModalCategoryChild
        initialValue={rowData}
        open={isOpenModalChild}
        onOk={handleOkChild}
        onCancel={handleCancel}
        isUpdate={isUpdate}
        options={allCategories}
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
