import { Select, Table, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import formatDate from "../../utils/formatDate";
import openNotification from "../../@crema/core/Notification";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const Permission = () => {
    const { t } = useTranslation();
    const { userInfo } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const page = Number(searchParams.get("_page")) || DEFAULT_PAGE;
    const pageSize = Number(searchParams.get("_per_page")) || DEFAULT_PER_PAGE;
    const [users, setUsers] = useState(null);
    const [totalItems, setTotalItems] = useState(0);
    const fetchUsers = useCallback(async () => {
        try {
            const { data, meta } = await axiosClient.post('/auth/users', { page, pageSize });
            setUsers(data)
            setTotalItems(meta.totalItems)
        } catch (error) {
            console.log(error);
        }
    }, [page, pageSize])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleUpdatePermisson = async (id: number, role: string) => {
        setIsLoading(true);
        try {
            await axiosClient.patch(`/auth/permission/${id}`, { role })
            openNotification('success', {
                message: 'Thành công',
                description: 'Chỉnh sửa quyền thành công'
            })
            await fetchUsers();
        } catch (error: any) {
            console.log(error);
            const errorMsg = error?.response?.data?.message;
            const description = Array.isArray(errorMsg)
                ? errorMsg.join(', ')
                : (errorMsg || 'Chỉnh sửa quyền thất bại');
            openNotification('error', {
                message: 'Thất bại',
                description
            })
        } finally {
            setIsLoading(false);
        }
    }

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email'
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string, record: any) => {
                if (role === 'SUPER_ADMIN') {
                    return (
                        <Tag color="gold">
                            SUPER ADMIN
                        </Tag>
                    )
                }

                const isSelf = Number(userInfo?.id) === Number(record.id);

                const roleOptions = [
                    { value: 'STAFF', label: 'STAFF' },
                    { value: 'ADMIN', label: 'ADMIN' },
                ];

                return (
                    <Select
                        value={role}
                        disabled={isSelf}
                        options={roleOptions}
                        onChange={(nRole) => handleUpdatePermisson(Number(record.id), nRole)}
                    />
                )
            }
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => formatDate(createdAt)
        },
        {
            title: 'Updated At',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (updatedAt) => formatDate(updatedAt)
        }
    ]

    const paginationConfig = {
        current: page,
        pageSize: pageSize,
        total: totalItems,
        showSizeChanger: true,
        pageSizeOptions: ["2", "5", "10", "20", "50"],
        showTotal: (total: number, range: [number, number]) =>
            `${t("product.pagination", {
                count: range[1] - range[0] + 1,
                total,
            })}`,
        onChange: (page: number, pageSize: number) => {
            setSearchParams({
                _page: String(page),
                _per_page: String(pageSize),
            });
        },
    };

    return (
        <>
            <Table loading={isLoading} columns={columns} dataSource={users} pagination={paginationConfig} />
        </>
    )
}

export default Permission;