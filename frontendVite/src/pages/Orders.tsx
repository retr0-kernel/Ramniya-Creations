import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchOrders } from "../features/orders/ordersSlice";
import Spinner from "../components/common/Spinner";
import ErrorAlert from "../components/common/ErrorAlert";
import {
    formatPrice,
    formatDateTime,
} from "../utils/formatters";

const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    shipped: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const Orders: React.FC = () => {
    const dispatch = useAppDispatch();
    const { orders, loading, error } = useAppSelector((state) => state.orders);

    useEffect(() => {
        dispatch(fetchOrders({ page: 1, limit: 20 }));
    }, [dispatch]);

    if (loading) return <Spinner fullScreen />;

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                        My Orders
                    </h1>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                        Track and manage your recent purchases
                    </p>
                </div>

                {error && <ErrorAlert error={error} />}

                {/* Empty State */}
                {orders.length === 0 ? (
                    <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-10 text-center shadow-lg">
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            No orders yet
                        </h3>
                        <p className="mt-2 text-zinc-500">
                            Once you place an order, it will appear here.
                        </p>

                        <Link
                            to="/products"
                            className="inline-block mt-6 px-6 py-3 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold shadow-xl hover:scale-[1.03] transition"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                            >
                                {/* Left */}
                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500">
                                        Order #{order.id.substring(0, 8)}
                                    </p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                        {formatDateTime(order.created_at)}
                                    </p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {order.items.length} item(s)
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    {formatPrice(order.amount_cents)}
                                </div>

                                {/* Status */}
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase w-fit ${
                                        statusStyles[order.status] || ""
                                    }`}
                                >
                  {order.status}
                </span>

                                {/* CTA */}
                                <Link
                                    to={`/orders/${order.id}`}
                                    className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-zinc-300 dark:border-white/10 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                >
                                    View Details →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Orders;
