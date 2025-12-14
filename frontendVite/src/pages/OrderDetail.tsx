import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchOrderById } from "../features/orders/ordersSlice";
import Spinner from "../components/common/Spinner";
import ErrorAlert from "../components/common/ErrorAlert";
import { formatPrice, formatDateTime } from "../utils/formatters";

const statusStyles: Record<string, string> = {
    pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    paid:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    shipped:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    delivered:
        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    cancelled:
        "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { currentOrder: order, loading, error } = useAppSelector(
        (state) => state.orders
    );

    useEffect(() => {
        if (id) dispatch(fetchOrderById(id));
    }, [dispatch, id]);

    if (loading) return <Spinner fullScreen />;
    if (error) return <ErrorAlert error={error} />;
    if (!order)
        return (
            <div className="min-h-screen flex items-center justify-center">
                Order not found
            </div>
        );

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                            Order Details
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                            Order #{order.id.substring(0, 8).toUpperCase()}
                        </p>
                    </div>

                    <Link
                        to="/orders"
                        className="px-5 py-2 rounded-full border border-zinc-300 dark:border-white/10 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                        ← Back to Orders
                    </Link>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">

                    {/* LEFT */}
                    <div className="space-y-6">

                        {/* Order Info */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-zinc-500">
                                        Placed on {formatDateTime(order.created_at)}
                                    </p>
                                </div>

                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                        statusStyles[order.status]
                                    }`}
                                >
                  {order.status}
                </span>
                            </div>

                            {/* Items */}
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                                Order Items
                            </h3>

                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-4 items-center border border-black/5 dark:border-white/10 rounded-xl p-4"
                                    >
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="h-16 w-16 rounded-lg object-cover"
                                        />

                                        <div className="flex-1">
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                SKU: {item.sku}
                                            </p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                Qty: {item.quantity}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-zinc-500">
                                                {formatPrice(item.price_cents)}
                                            </p>
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                {formatPrice(item.price_cents * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                Shipping Address
                            </h3>

                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                <strong className="text-zinc-900 dark:text-zinc-100">
                                    {order.shipping_address.name}
                                </strong>
                                <br />
                                {order.shipping_address.line1}
                                <br />
                                {order.shipping_address.line2 && (
                                    <>
                                        {order.shipping_address.line2}
                                        <br />
                                    </>
                                )}
                                {order.shipping_address.city},{" "}
                                {order.shipping_address.state}{" "}
                                {order.shipping_address.pincode}
                                <br />
                                {order.shipping_address.country}
                                <br />
                                Phone: {order.shipping_address.phone}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-6">

                        {/* Summary */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                                Order Summary
                            </h3>

                            <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Subtotal
                </span>
                                <span>{formatPrice(order.amount_cents)}</span>
                            </div>

                            <div className="flex justify-between font-semibold text-lg border-t border-black/5 dark:border-white/10 pt-4 mt-4">
                                <span>Total</span>
                                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(order.amount_cents)}
                </span>
                            </div>

                            {order.status === "paid" && order.paid_at && (
                                <div className="mt-4 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-4 py-3 text-sm">
                                    Paid on {formatDateTime(order.paid_at)}
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        {order.razorpay_payment_id && (
                            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                    Payment Details
                                </h3>

                                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                    <p>
                                        <strong>Payment ID:</strong>{" "}
                                        {order.razorpay_payment_id}
                                    </p>
                                    <p>
                                        <strong>Order ID:</strong>{" "}
                                        {order.razorpay_order_id}
                                    </p>
                                    <p>
                                        <strong>Method:</strong>{" "}
                                        {order.payment_method || "Razorpay"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default OrderDetail;
