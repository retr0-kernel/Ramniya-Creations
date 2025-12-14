import React from "react";
import { CartItem as CartItemType } from "../../types";
import { formatPrice } from "../../utils/formatters";

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({
                                               item,
                                               onUpdateQuantity,
                                               onRemove,
                                           }) => {
    return (
        <div className="flex gap-5">

            {/* IMAGE */}
            <div className="h-28 w-28 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10">
                <img
                    src={item.image_url || "/placeholder.jpg"}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                />
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex flex-col justify-between">

                {/* TOP */}
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                    </h3>

                    {item.sku && (
                        <p className="mt-1 text-xs text-zinc-500">
                            SKU: {item.sku}
                        </p>
                    )}
                </div>

                {/* BOTTOM */}
                <div className="flex items-end justify-between gap-4 mt-4">

                    {/* PRICE + QTY */}
                    <div className="space-y-3">

                        {/* UNIT PRICE */}
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Price:{" "}
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(item.price_cents)}
              </span>
                        </p>

                        {/* QUANTITY CONTROLS */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                className="
                  h-9 w-9 rounded-full
                  border border-zinc-300 dark:border-white/10
                  text-lg font-medium
                  hover:bg-zinc-100 dark:hover:bg-zinc-800
                  disabled:opacity-40
                "
                            >
                                −
                            </button>

                            <span className="min-w-[32px] text-center font-semibold">
                {item.quantity}
              </span>

                            <button
                                onClick={() => onUpdateQuantity(item.quantity + 1)}
                                className="
                  h-9 w-9 rounded-full
                  border border-zinc-300 dark:border-white/10
                  text-lg font-medium
                  hover:bg-zinc-100 dark:hover:bg-zinc-800
                "
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* TOTAL + REMOVE */}
                    <div className="flex flex-col items-end gap-3">

                        {/* TOTAL PRICE */}
                        <p className="text-lg font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            {formatPrice(item.price_cents * item.quantity)}
                        </p>

                        {/* REMOVE */}
                        <button
                            onClick={onRemove}
                            className="
                text-sm font-semibold
                text-red-500 hover:text-red-600
                hover:underline
              "
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
