import { EditOutlined } from "@ant-design/icons";
import { Flex, Grid, Input, Space, Table, type TableProps } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AntButton from "../../@crema/component/AntButton";
import openNotification from "../../@crema/core/Notification";
import { GetCategoryById, updateCategoryChild } from "../../api/categoryApi";
import { UserPermission } from "../../api/userPermission";
import type { CategoryType } from "../../types/domain";
import { ModalCategoryChild } from "../modal";
import { useTranslation } from "react-i18next";

const CategoryChild = () => {
  const screens = Grid.useBreakpoint();
  const { t } = useTranslation();
  const isMobile = !screens.md;
  const { id } = useParams();
  const { Search } = Input;
  const [data, setData] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [rowData, setRowData] = useState<CategoryType | null>(null);
  const keyword = searchText.trim().toLocaleLowerCase();
  const { isAdmin } = UserPermission();
  const filterDataCategoryChild = data.filter(
    (item) => !keyword || item.name?.toLowerCase().includes(keyword),
  );

  const handleSearch = (value: string | number | null) => {
    setSearchText(value ? String(value) : "");
  };

  const fetchCategory = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await GetCategoryById(id);
      setData(res.child ?? []);
    } catch (err) {
      return err;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategory();
  }, [fetchCategory]);

  const handleEdit = (record: CategoryType) => {
    setRowData(record);
    setIsOpenModal(true);
  };

  const handleCancel = () => {
    setIsOpenModal(false);
    setRowData(null);
  };

  const handleOk = async (values: CategoryType) => {
    if (!id || !rowData?.id) {
      return;
    }

    await updateCategoryChild(id, rowData.id, values);
    await fetchCategory();
    setIsOpenModal(false);
    setRowData(null);

    openNotification("success", {
      message: t("common.success"),
      description: t("category.notification.updateChildSuccess"),
    });
  };

  const columns: TableProps<CategoryType>["columns"] = [
    {
      title: t("category.columns.no"),
      fixed: !isMobile ? "start" : false,
      width: 20,
      render: (_value, _record, index) => index + 1,
    },
    {
      title: t("category.columns.childName"),
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "start",
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
      fixed: "end",
      width: 100,
      hidden: !isAdmin,
      align: "center",
      render: (_, record) => {
        return (
          <Space size="medium">
            <AntButton
              tooltip={t("common.update")}
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Flex className="page-stack" gap="medium" vertical>
        <div className="page-toolbar">
          <Search
            allowClear={true}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={t("category.placeholder.search")}
            className="page-search"
          />
        </div>
        <div className="table-shell">
          <Table<CategoryType>
            rowKey="id"
            columns={columns}
            dataSource={filterDataCategoryChild}
            loading={isLoading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Flex>

      <ModalCategoryChild
        initialValue={rowData}
        open={isOpenModal}
        onOk={handleOk}
        onCancel={handleCancel}
        isUpdate={true}
      />
    </>
  );
};

export default CategoryChild;
