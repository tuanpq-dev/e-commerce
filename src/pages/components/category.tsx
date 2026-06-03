import { Button, Flex, Input, Space, Table } from "antd";
import type React from "react";
import type { TableProps } from "antd";
import type { CategoryType } from "../../types/domain";
import {
  CreateCategory,
  DeleteCategory,
  GetCategory,
  UpdateCategory,
} from "../../api/categoryApi";
import { ModalCategory } from "../modal";
import { useState } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import openNotification from "../../@crema/core/Notification";

const Category: React.FC = () => {
  const { Search } = Input;
  const [rowData, setRowData] = useState<CategoryType>();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const { category, isLoading, refetch } = GetCategory();
  const [isUpdate, setIsUpdate] = useState(false);

  const handleAdd = () => {
    setIsOpenModal(true);
    setIsUpdate(false);
    setRowData({});
  };

  const handleCancel = () => {
    setIsOpenModal(false);
  };

  const handleDelete = async (id: number | string) => {
    await DeleteCategory(id);
    await refetch();

    openNotification("success", {
      message: "Thành công",
      description: "Xóa thành công danh mục",
    });
  };

  const handleUpdate = (values: CategoryType) => {
    setRowData(values);
  };

  const columns: TableProps<CategoryType>["columns"] = [
    {
      title: "Name Category",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "start",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 100,
    },
    {
      title: "Action",
      key: "action",
      fixed: "end",
      width: 100,
      align: "center",
      render: (_, record) => {
        return (
          <>
            <Space size="medium">
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  handleUpdate(record);
                  setIsUpdate(true);
                  setIsOpenModal(true);
                }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  console.log(record.id);
                  if (record.id) {
                    handleDelete(record.id);
                  }
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

      await UpdateCategory(updateValues);
      await refetch();
      setIsOpenModal(false);
      setIsUpdate(false);
      setRowData({});

      openNotification("success", {
        message: "Thành công",
        description: "Chỉnh sửa danh mục thành công",
      });
    } else {
      await CreateCategory(values);
      await refetch();

      setIsOpenModal(false);
      openNotification("success", {
        message: "Thành công",
        description: "Thêm mới danh mục thành công",
      });
    }
  };

  return (
    <>
      <Flex gap="medium" vertical>
        <Flex align="center" gap="medium" justify="space-between">
          <Search
            allowClear={true}
            placeholder="Tìm kiếm sản phẩm"
            style={{ width: "20%" }}
          />
          <Button type="primary" onClick={handleAdd}>
            Add
          </Button>
        </Flex>
        <div style={{ border: "1px solid #f3f5f7" }}>
          <Table<CategoryType>
            rowKey="name"
            columns={columns}
            dataSource={category}
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
    </>
  );
};

export default Category;
