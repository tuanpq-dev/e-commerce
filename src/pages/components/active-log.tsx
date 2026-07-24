import { Flex, Table, Tag, type TableProps } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ActiveLogType } from "../../types/domain";
import formatDate from "../../utils/formatDate";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import PayloadCell from "./payload-cell";

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
      title: t("activeLog.columns.userId"),
      dataIndex: "userId",
      key: "userId",
      width: 100,
      align: "center",
      render: (userId, record) => {
        const displayVal = userId ?? record.user?.id ?? "-";
        return displayVal !== "-" ? <Tag color="blue">{String(displayVal)}</Tag> : "-";
      },
    },
    {
      title: t("activeLog.columns.user"),
      dataIndex: "userName",
      key: "userName",
      width: 150,
      render: (_, record) => {
        if (record.userName) return record.userName;
        if (record.user) {
          if (typeof record.user === "string") return record.user;
          return record.user.fullname || record.user.email || "Unknown";
        }
        return "Unknown";
      },
    },
    {
      title: t("activeLog.columns.role"),
      dataIndex: "userRole",
      key: "userRole",
      width: 100,
      render: (_, record) => {
        const role = record.userRole || record.user?.role;
        return role ? <Tag color="cyan">{role}</Tag> : "-";
      },
    },
    {
      title: t("activeLog.columns.module"),
      dataIndex: "module",
      key: "module",
      width: 100,
      render: (module) => {
        const displayMod =
          typeof module === "object" && module !== null
            ? JSON.stringify(module)
            : module ?? "";
        return <Tag color="blue">{String(displayMod)}</Tag>;
      },
    },
    {
      title: t("activeLog.columns.action"),
      dataIndex: "action",
      key: "action",
      width: 100,
      render: (action) => {
        if (typeof action === "object" && action !== null) {
          return JSON.stringify(action);
        }
        return action ? String(action) : "-";
      },
    },
    {
      title: "Payload",
      dataIndex: "payload",
      key: "payload",
      width: 300,
      render: (payload) => <PayloadCell payload={payload} />,
    },
  ];

  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: totalItems,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
    showTotal: (total: number, range: [number, number]) =>
      `${t("activeLog.pagination", {
        count: range ? range[1] - range[0] + 1 : 0,
        total: total || 0,
      })}`,
    onChange: (page: number, pageSize: number) => {
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
