import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import { API_ENDPOINTS } from "../../api/endpoints";
import Spinner from "../../components/common/Spinner";
import {
    formatPrice,
    formatDateTime,
} from "../../utils/formatters";
import { Order } from "../../types";

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [status, page]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            params.append("page", page.toString());
            params.append("limit", "20");

            const res = await axios.get(
                `${API_ENDPOINTS.ADMIN_ORDERS}?${params}`
            );

            setOrders(res.data.orders || []);
            setTotalPages(res.data.pagination?.total_pages || 1);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        await axios.put(API_ENDPOINTS.ADMIN_ORDER_STATUS(id), {
            status: newStatus,
        });
        fetchOrders();
    };

    const filteredOrders = orders.filter((o) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            o.id.toLowerCase().includes(s) ||
            o.user_id.toLowerCase().includes(s) ||
            o.razorpay_order_id?.toLowerCase().includes(s)
        );
    });

    if (loading && orders.length === 0) return <Spinner fullScreen />;

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                        Manage Orders
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Track, review, and update customer orders
                    </p>
                </div>

                {/* FILTER BAR */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-xl p-5 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="
              rounded-full px-4 py-2
              bg-zinc-100 dark:bg-zinc-800
              border border-black/5 dark:border-white/10
              text-sm
              text-zinc-900 dark:text-zinc-100
            "
                    >
                        <option value="">All statuses</option>
                        <option value="created">Created</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <input
                        placeholder="Search by Order ID, User ID or Razorpay ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
              rounded-full px-5 py-2
              bg-zinc-100 dark:bg-zinc-800
              border border-black/5 dark:border-white/10
              text-sm
              text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400
            "
                    />
                </div>

                {/* TABLE CONTAINER */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-xl overflow-hidden">

                    {/* TABLE HEADER */}
                    <div className="
            grid grid-cols-[120px_120px_160px_80px_120px_120px_140px]
            gap-4 px-6 py-4
            text-xs font-semibold uppercase
            text-zinc-700 dark:text-zinc-300
            bg-zinc-100 dark:bg-zinc-800
          ">
                        <div>Order</div>
                        <div>User</div>
                        <div>Date</div>
                        <div>Items</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div>Update</div>
                    </div>

                    {/* TABLE BODY */}
                    {loading ? (
                        <div className="py-16 text-center">
                            <Spinner />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-20 text-center text-zinc-500 dark:text-zinc-400">
                            No orders found
                        </div>
                    ) : (
                        filteredOrders.map((o) => (
                            <div
                                key={o.id}
                                className="
                  grid grid-cols-[120px_120px_160px_80px_120px_120px_140px]
                  gap-4 px-6 py-4 items-center
                  text-sm
                  text-zinc-900 dark:text-zinc-100
                  border-t border-black/5 dark:border-white/10
                  hover:bg-zinc-50 dark:hover:bg-zinc-800/40
                  transition
                "
                            >
                                <code className="text-xs text-zinc-700 dark:text-zinc-300">
                                    #{o.id.slice(0, 8)}
                                </code>

                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {o.user_id.slice(0, 8)}
                </span>

                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {formatDateTime(o.created_at)}
                </span>

                                <span>{o.items.length}</span>

                                <span className="font-semibold">
                  {formatPrice(o.amount_cents)}
                </span>

                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                                        o.status === "paid"
                                            ? "bg-green-500/15 text-green-500"
                                            : o.status === "pending"
                                                ? "bg-yellow-500/15 text-yellow-500"
                                                : "bg-red-500/15 text-red-500"
                                    }`}
                                >
                  {o.status.toUpperCase()}
                </span>

                                <select
                                    value={o.status}
                                    onChange={(e) =>
                                        handleStatusChange(o.id, e.target.value)
                                    }
                                    className="
                    rounded-full px-3 py-1
                    bg-zinc-100 dark:bg-zinc-800
                    border border-black/5 dark:border-white/10
                    text-xs
                    text-zinc-900 dark:text-zinc-100
                  "
                                >
                                    <option value="created">Created</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                        ))
                    )}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="
                px-5 py-2 rounded-full border
                text-sm
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                disabled:opacity-40
              "
                        >
                            Previous
                        </button>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="
                px-5 py-2 rounded-full border
                text-sm
                text-zinc-900 dark:text-zinc-100
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                disabled:opacity-40
              "
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
};

export default AdminOrders;
