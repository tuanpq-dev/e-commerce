import { Flex, Table, type TableProps } from "antd";
import { useEffect, useState } from "react";
import { GetActiveLogs } from "../../api/activeLogApi";
import type { ActiveLogType } from "../../types/domain";
import formatDate from "../../utils/formatDate";

const ActiveLog = () => {
  const [dataActiveLog, setDataActiveLog] = useState<ActiveLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await GetActiveLogs();
      setDataActiveLog(data ?? []);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: TableProps<ActiveLogType>["columns"] = [
    {
      title: "Time",
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      render: (_, record) =>
        record.created_at ? formatDate(record.created_at) : "",
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 100,
    },
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      width: 100,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 100,
    },
  ];
  return (
    <Flex className="page-stack" gap="medium" vertical>
      <div className="table-shell">
        <Table<ActiveLogType>
          rowKey="id"
          columns={columns}
          dataSource={dataActiveLog}
          loading={isLoading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </Flex>
  );
};

export default ActiveLog;
