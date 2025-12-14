import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { updateQuantity, removeFromCart } from "../features/cart/cartSlice";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";

const Cart: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { items, total } = useAppSelector((state) => state.cart);
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const handleUpdateQuantity = (
        productId: string,
        variantId: string | undefined,
        quantity: number
    ) => {
        dispatch(updateQuantity({ product_id: productId, variant_id: variantId, quantity }));
    };

    const handleRemove = (productId: string, variantId: string | undefined) => {
        dispatch(removeFromCart({ product_id: productId, variant_id: variantId }));
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: "/checkout" } });
        } else {
            navigate("/checkout");
        }
    };

    const itemsCount = items.reduce((count, item) => count + item.quantity, 0);

    /* ---------------- EMPTY STATE ---------------- */
    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
                <div className="max-w-md text-center bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-3xl p-10 shadow-xl text-zinc-900 dark:text-zinc-100">
                    <div className="text-6xl mb-4">🛒</div>

                    <h2 className="text-2xl font-semibold">
                        Your cart is empty
                    </h2>

                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Looks like you haven’t added anything yet.
                    </p>

                    <Link
                        to="/products"
                        className="inline-block mt-6 px-6 py-3 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold shadow-xl hover:scale-[1.03] transition"
                    >
                        Browse Products
                    </Link>
                </div>
            </main>
        );
    }

    /* ---------------- CART PAGE ---------------- */
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                        Shopping Cart
                    </h1>

                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        You have {itemsCount} item{itemsCount !== 1 ? "s" : ""} in your cart
                    </p>
                </div>

                {/* LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">

                    {/* CART ITEMS */}
                    <div className="space-y-6">
                        {items.map((item) => (
                            <div
                                key={`${item.product_id}-${item.variant_id}`}
                                className="
                  rounded-2xl
                  bg-white dark:bg-zinc-900
                  border border-black/5 dark:border-white/10
                  shadow-lg p-4
                  text-zinc-900 dark:text-zinc-100
                "
                            >
                                {/* Force readable text inside */}
                                <CartItem
                                    item={item}
                                    onUpdateQuantity={(qty) =>
                                        handleUpdateQuantity(item.product_id, item.variant_id, qty)
                                    }
                                    onRemove={() =>
                                        handleRemove(item.product_id, item.variant_id)
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    {/* SUMMARY */}
                    <div className="sticky top-24 h-fit">
                        <div
                            className="
                rounded-2xl
                bg-white dark:bg-zinc-900
                border border-black/5 dark:border-white/10
                shadow-xl p-6
                text-zinc-900 dark:text-zinc-100
              "
                        >
                            {/* Force readable text inside */}
                            <CartSummary
                                total={total}
                                itemsCount={itemsCount}
                                onCheckout={handleCheckout}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Cart;
