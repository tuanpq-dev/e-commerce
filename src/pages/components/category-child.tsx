import { useParams } from "react-router-dom";
import type { CategoryType } from "../../types/domain";
import { Flex, Input, Space, Table, type TableProps } from "antd";
import AntButton from "../../@crema/component/AntButton";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { GetCategoryById } from "../../api/categoryApi";

const CategoryChild = () => {
  const { id } = useParams();
  const { Search } = Input;
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategory = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await GetCategoryById(id);
      setData(res.child);
    } catch (err) {
      return err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, []);

  const columns: TableProps<CategoryType>["columns"] = [
    {
      title: "Tên danh mục con",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "start",
    },
    {
      title: "Tổng sản phẩm",
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
      render: () => {
        return (
          <>
            <Space size="medium">
              <AntButton tooltip="Chỉnh sửa" icon={<EditOutlined />} />
              <AntButton danger tooltip="Xóa" icon={<DeleteOutlined />} />
            </Space>
          </>
        );
      },
    },
  ];
  return (
    <Flex gap="medium" vertical>
      <Flex align="center" gap="medium" justify="space-between">
        <Search
          allowClear={true}
          placeholder="Tìm kiếm danh mục"
          style={{ width: "20%" }}
        />
      </Flex>
      <div style={{ border: "1px solid #f3f5f7" }}>
        <Table<CategoryType>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={isLoading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </Flex>
  );
};

export default CategoryChild;
