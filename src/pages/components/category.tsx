import { Flex, Grid, Input, Space, Table } from "antd";
import type React from "react";
import type { TableProps } from "antd";
import type { CategoryType } from "../../types/domain";
import {
  CreateCategory,
  CreateCategoryChild,
  DeleteCategory,
  GetCategory,
  UpdateCategory,
} from "../../api/categoryApi";
import { ModalCategory, ModalCategoryChild } from "../modal";
import { useState } from "react";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import openNotification from "../../@crema/core/Notification";
import AntButton from "../../@crema/component/AntButton";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import ModalConfirm from "../../@crema/core/ModalConfirm";
import { CreateActiveLog } from "../../api/activeLogApi";
import { useAuth } from "../../contexts/AuthContext";
import { UserPermission } from "../../api/userPermission";
import useDebounce from "../../@crema/core/hook/useDebounce";
import { useTranslation } from "react-i18next";

const Category: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { Search } = Input;
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [rowData, setRowData] = useState<CategoryType>();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isOpenModalChild, setIsOpenModalChild] = useState(false);
  const [isOpenModalDelete, setIsOpenModalDelete] = useState(false);
  const { category, isLoading, refetch } = GetCategory();
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { isAdmin } = UserPermission();

  const keyword = useDebounce(searchText.trim().toLocaleLowerCase());
  const filterData = category.filter(
    (item) => !keyword || item.name?.toLowerCase().includes(keyword),
  );

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

    if (rowData?.child && rowData.child.length > 0) {
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
        user: userInfo?.name ?? "Unknown",
      });

      await refetch();

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
      render: (_value, _record, index) => index + 1,
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
        return record?.child ? record?.child.length : 0;
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
                tooltip={t("category.tooltip.viewChildren")}
                icon={<EyeOutlined />}
                onClick={() => {
                  if (!record.id) {
                    return;
                  }

                  navigate(`/${config.routes.CATEGORY_CHILD(record.id)}`);
                }}
              />
              {isAdmin && (
                <AntButton
                  tooltip={t("common.update")}
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleUpdate(record);
                    setIsUpdate(true);
                    setIsOpenModal(true);
                  }}
                />
              )}

              {isAdmin && (
                <AntButton
                  danger
                  tooltip={t("common.delete")}
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setIsOpenModalDelete(true);
                    setRowData({
                      id: record.id,
                      name: record.name,
                      child: record.child,
                    });
                  }}
                />
              )}
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

      await refetch();
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
        CreateActiveLog({
          module: "Category",
          action: "CREATE",
          user: userInfo?.name,
        }),
      ]);
      await refetch();

      setIsOpenModal(false);
      openNotification("success", {
        message: t("common.success"),
        description: t("category.notification.createParentSuccess"),
      });
    }
  };

  const handleOkChild = async (values: CategoryType) => {
    await Promise.all([
      CreateCategoryChild(values),
      CreateActiveLog({
        module: "Category - Child",
        action: "CREATE",
        user: userInfo?.name,
      }),
    ]);
    await refetch();
    setIsOpenModalChild(false);
    openNotification("success", {
      message: t("common.success"),
      description: t("category.notification.createChildSuccess"),
    });
  };

  const handleSearch = (value: string | number | null) => {
    setSearchText(value ? String(value) : "");
  };

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <Search
            allowClear={true}
            placeholder={t("category.placeholder.search")}
            onChange={(event) => handleSearch(event.target.value)}
            className="page-search"
          />
          {isAdmin && (
            <div className="page-toolbar-actions">
              <AntButton
                tooltip={t("common.add")}
                type="primary"
                onClick={handleAddChild}
              >
                {t("category.addChild")}
              </AntButton>
              <AntButton tooltip={t("common.add")} type="primary" onClick={handleAdd}>
                {t("category.addParent")}
              </AntButton>
            </div>
          )}
        </div>
        <div className="table-shell">
          <Table<CategoryType>
            rowKey="id"
            columns={columns}
            dataSource={filterData.reverse()}
            loading={isLoading}
            pagination={{ pageSize: 5 }}
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
        options={category}
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
