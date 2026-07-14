import { Flex, Table, type TableProps } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ActiveLogType } from "../../types/domain";
import formatDate from "../../utils/formatDate";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const ActiveLog = () => {
  const { t } = useTranslation();
  const [dataActiveLog, setDataActiveLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("_page")) || DEFAULT_PAGE;
  const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const payload = { page: currentPage, pageSize };
      const { data, meta } = await axiosClient.post('/active-log/search', payload);
      setDataActiveLog(data);
      setTotalItems(meta.totalItems);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize]);

  const columns: TableProps<ActiveLogType>["columns"] = [
    {
      title: t("activeLog.columns.time"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (_, record) =>
        record.createdAt ? formatDate(record.createdAt) : "",
    },
    {
      title: t("activeLog.columns.user"),
      dataIndex: "user",
      key: "user",
      width: 100,
    },
    {
      title: t("activeLog.columns.module"),
      dataIndex: "module",
      key: "module",
      width: 100,
    },
    {
      title: t("activeLog.columns.action"),
      dataIndex: "action",
      key: "action",
      width: 100,
    },
  ];

  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: totalItems,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
    showTotal: (total, range) =>
      `${t("activeLog.pagination", {
        count: range[1] - range[0] + 1,
        total,
      })}`,
    onChange: (page, pageSize) => {
      setSearchParams({
        _page: String(page),
        _per_page: String(pageSize),
      });
    },
  };

  return (
    <Flex className="page-stack" gap="medium" vertical>
      <div className="table-shell">
        <Table<ActiveLogType>
          rowKey="id"
          columns={columns}
          dataSource={dataActiveLog}
          loading={isLoading}
          pagination={paginationConfig}
          scroll={{ x: "max-content" }}
        />
      </div>
    </Flex>
  );
};

export default ActiveLog;
