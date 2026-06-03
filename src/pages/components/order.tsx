import { Button, Flex, Input, Table } from "antd";
import type React from "react";
import type { CategoryType } from "../../types/domain";
// import { GetCategory } from "../../api/categoryApi";

const Order: React.FC = () => {
  const { Search } = Input;

  // const { category, isLoading } = GetCategory();

  const columns = [
    {
      title: "Name Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
    },
  ];
  return (
    <>
      <Flex gap="medium" vertical>
        <Flex align="center" gap="medium" justify="space-between">
          <Search
            allowClear={true}
            placeholder="Tìm kiếm sản phẩm"
            style={{ width: "20%" }}
          />
          <Button type="primary">Add</Button>
        </Flex>
        <div style={{ border: "1px solid #f3f5f7" }}>
          <Table<CategoryType>
            rowKey="category"
            columns={columns}
            // dataSource={category}
            // loading={isLoading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Flex>
      {/* 
      <ModalProduct
        initialValue={rowData}
        open={isOpenModal}
        onOk={handleOk}
        onCancel={handleCancel}
        isUpdate={isUpdate}
      /> */}
    </>
  );
};

export default Order;
