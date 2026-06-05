import { Button, Flex, Input, Table, type TableProps } from "antd";
import type React from "react";
import type { OrderType } from "../../types/domain";

const Order: React.FC = () => {
  const { Search } = Input;

  const columns: TableProps<OrderType>["columns"] = [
    {
      title: "Mã đơn",
      dataIndex: "order_code",
      key: "order_code",
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
    },
    {
      title: "Ngày tạo",
      dataIndex: "create_order",
      key: "create_order",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
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
          <Table<OrderType>
            rowKey="order_code"
            columns={columns}
            // dataSource={category}
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
