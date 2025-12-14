import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axiosConfig";
import { API_ENDPOINTS } from "../../api/endpoints";
import { formatPrice, formatDateTime } from "../../utils/formatters";
import Spinner from "../../components/common/Spinner";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
);

interface OrderStats {
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
    failed_orders: number;
    total_revenue: number;
    today_revenue: number;
    week_revenue: number;
    month_revenue: number;
}

interface RecentOrder {
    id: string;
    user_email: string;
    amount_cents: number;
    status: string;
    created_at: string;
}

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const statsRes = await axios.get(API_ENDPOINTS.ADMIN_ORDER_STATS);
            const ordersRes = await axios.get(
                `${API_ENDPOINTS.ADMIN_ORDERS}?page=1&limit=8`
            );
            setStats(statsRes.data);
            setRecentOrders(ordersRes.data.orders || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner fullScreen />;

    /* ---------------- CHART DATA ---------------- */
    const revenueChartData = {
        labels: ["Today", "This Week", "This Month"],
        datasets: [
            {
                data: [
                    (stats?.today_revenue || 0) / 100,
                    (stats?.week_revenue || 0) / 100,
                    (stats?.month_revenue || 0) / 100,
                ],
                backgroundColor: "#facc15",
            },
        ],
    };

    const ordersChartData = {
        labels: ["Paid", "Pending", "Failed"],
        datasets: [
            {
                data: [
                    stats?.paid_orders || 0,
                    stats?.pending_orders || 0,
                    stats?.failed_orders || 0,
                ],
                backgroundColor: ["#22c55e", "#facc15", "#ef4444"],
            },
        ],
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-950 px-8 py-10">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* HEADER */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Overview of store performance
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            to="/admin/products"
                            className="px-5 py-3 rounded-full border border-zinc-300 dark:border-white/10 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            Manage Products
                        </Link>
                        <Link
                            to="/admin/orders"
                            className="px-5 py-3 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold shadow-lg"
                        >
                            Manage Orders
                        </Link>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            label: "Total Orders",
                            value: stats?.total_orders,
                        },
                        {
                            label: "Total Revenue",
                            value: formatPrice(stats?.total_revenue || 0),
                            highlight: true,
                        },
                        {
                            label: "Paid Orders",
                            value: stats?.paid_orders,
                        },
                        {
                            label: "Pending Orders",
                            value: stats?.pending_orders,
                        },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className="rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-black/5 dark:border-white/10 p-6 shadow-xl"
                        >
                            <p className="text-sm text-zinc-500">{s.label}</p>
                            <h3
                                className={`mt-2 text-2xl font-bold ${
                                    s.highlight
                                        ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent"
                                        : "text-zinc-900 dark:text-zinc-100"
                                }`}
                            >
                                {s.value}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-black/5 dark:border-white/10 p-6 shadow-xl">
                        <h3 className="font-semibold mb-4">Revenue Overview</h3>
                        <Bar data={revenueChartData} />
                    </div>

                    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-black/5 dark:border-white/10 p-6 shadow-xl">
                        <h3 className="font-semibold mb-4">Order Status</h3>
                        <Doughnut data={ordersChartData} />
                    </div>
                </div>

                {/* RECENT ORDERS */}
                <div className="rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-black/5 dark:border-white/10 p-6 shadow-xl">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-semibold">Recent Orders</h3>
                        <Link
                            to="/admin/orders"
                            className="text-sm font-semibold text-amber-500 hover:underline"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-zinc-500">
                            <tr>
                                <th className="py-3">Order</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentOrders.map((o) => (
                                <tr
                                    key={o.id}
                                    className="border-t border-zinc-200 dark:border-zinc-800"
                                >
                                    <td className="py-3 font-mono">#{o.id.slice(0, 8)}</td>
                                    <td>{o.user_email}</td>
                                    <td className="font-semibold">
                                        {formatPrice(o.amount_cents)}
                                    </td>
                                    <td>
                      <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              o.status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : o.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                          }`}
                      >
                        {o.status.toUpperCase()}
                      </span>
                                    </td>
                                    <td className="text-zinc-500">
                                        {formatDateTime(o.created_at)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AdminDashboard;
