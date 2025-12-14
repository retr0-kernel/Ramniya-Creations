import React from "react";
import { formatPrice } from "../../utils/formatters";

interface CartSummaryProps {
    total: number;
    itemsCount: number;
    onCheckout: () => void;
    loading?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
                                                     total,
                                                     itemsCount,
                                                     onCheckout,
                                                     loading = false,
                                                 }) => {
    const shippingCost = total > 500000 ? 0 : 10000; // Free shipping over ₹5000
    const tax = Math.round(total * 0.18); // 18% GST
    const grandTotal = total + shippingCost + tax;
    const remainingForFreeShipping = Math.max(0, 500000 - total);

    return (
        <div
            className="
        rounded-3xl
        bg-white/90 dark:bg-zinc-900/90 backdrop-blur
        border border-black/5 dark:border-white/10
        shadow-2xl
        p-6
        text-zinc-900 dark:text-zinc-100
      "
        >
            {/* HEADER */}
            <h3 className="text-lg font-semibold mb-6">
                Order Summary
            </h3>

            {/* BREAKDOWN */}
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">
            Subtotal ({itemsCount} item{itemsCount !== 1 ? "s" : ""})
          </span>
                    <span className="font-medium">{formatPrice(total)}</span>
                </div>

                <div className="flex justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">
            Shipping
          </span>
                    {shippingCost === 0 ? (
                        <span className="font-semibold text-emerald-500">
              FREE
            </span>
                    ) : (
                        <span className="font-medium">
              {formatPrice(shippingCost)}
            </span>
                    )}
                </div>

                <div className="flex justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">
            GST (18%)
          </span>
                    <span className="font-medium">
            {formatPrice(tax)}
          </span>
                </div>
            </div>

            {/* DIVIDER */}
            <div className="my-5 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent" />

            {/* TOTAL */}
            <div className="flex justify-between items-end mb-4">
        <span className="text-base font-semibold">
          Total
        </span>
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
          {formatPrice(grandTotal)}
        </span>
            </div>

            {/* FREE SHIPPING HINT */}
            {shippingCost > 0 && (
                <div className="mb-5 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    Add{" "}
                    <strong>{formatPrice(remainingForFreeShipping)}</strong>{" "}
                    more for free shipping 🚚
                </div>
            )}

            {/* CTA */}
            <button
                onClick={onCheckout}
                disabled={loading || itemsCount === 0}
                className="
          w-full
          px-6 py-4
          rounded-full
          bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500
          text-black font-bold text-lg
          shadow-lg shadow-yellow-500/40
          hover:scale-[1.02]
          active:scale-[0.98]
          transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
            >
                {loading ? "Processing..." : "Proceed to Checkout"}
            </button>

            {/* TRUST */}
            <p className="mt-4 text-xs text-center text-zinc-500">
                🔒 Secure payments · 🚚 Fast delivery
            </p>
        </div>
    );
};

export default CartSummary;
