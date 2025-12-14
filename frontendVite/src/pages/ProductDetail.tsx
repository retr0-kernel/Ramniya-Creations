import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchProductById } from "../features/products/productsSlice";
import { addToCart } from "../features/cart/cartSlice";
import VariantSelector from "../components/products/VariantSelector";
import ProductImageZoom from "../components/products/ProductImageZoom";
import Spinner from "../components/common/Spinner";
import ErrorAlert from "../components/common/ErrorAlert";
import { formatPrice } from "../utils/formatters";
import { type ProductVariant } from "../types";

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { currentProduct: product, loading, error } =
        useAppSelector((state) => state.products);

    const [selectedVariant, setSelectedVariant] =
        useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (id) dispatch(fetchProductById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (product?.variants?.length) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    if (loading) return <Spinner fullScreen />;
    if (error) return <ErrorAlert error={error} />;
    if (!product)
        return (
            <div className="min-h-screen flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                Product not found
            </div>
        );

    const currentPrice =
        product.price + (selectedVariant?.price_modifier || 0);

    const isOutOfStock = selectedVariant?.stock === 0;

    const handleAddToCart = () => {
        const variant = selectedVariant || product.variants?.[0];
        const primaryImage =
            product.images?.find((i) => i.is_primary) || product.images?.[0];

        dispatch(
            addToCart({
                product_id: product.id,
                variant_id: variant?.id,
                title: product.title,
                sku: variant?.sku || "",
                quantity,
                price_cents: currentPrice,
                image_url: primaryImage?.url || "/placeholder.jpg",
            })
        );

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate("/cart");
    };

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* IMAGE */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-xl p-6">
                    <ProductImageZoom
                        images={product.images || []}
                        title={product.title}
                    />
                </div>

                {/* DETAILS */}
                <div className="space-y-6">

                    {/* TITLE */}
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                        {product.title}
                    </h1>

                    {/* PRICE */}
                    <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-amber-500">
              {formatPrice(currentPrice)}
            </span>

                        {selectedVariant?.price_modifier !== 0 && (
                            <span className="line-through text-zinc-400 text-lg">
                {formatPrice(product.price)}
              </span>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {product.description}
                    </p>

                    {/* VARIANTS */}
                    {product.variants?.length > 0 && (
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow p-4 text-zinc-900 dark:text-zinc-100">
                            <VariantSelector
                                variants={product.variants}
                                selectedVariant={selectedVariant}
                                onSelect={setSelectedVariant}
                            />
                        </div>
                    )}

                    {/* QUANTITY */}
                    <div>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Quantity
                        </p>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1 || isOutOfStock}
                                className="h-10 w-10 rounded-full border border-zinc-300 dark:border-white/10 text-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                            >
                                −
                            </button>

                            <span className="min-w-[40px] text-center font-semibold text-zinc-900 dark:text-zinc-100">
                {quantity}
              </span>

                            <button
                                onClick={() =>
                                    setQuantity(
                                        Math.min(selectedVariant?.stock || 99, quantity + 1)
                                    )
                                }
                                disabled={isOutOfStock}
                                className="h-10 w-10 rounded-full border border-zinc-300 dark:border-white/10 text-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                            >
                                +
                            </button>

                            {selectedVariant && (
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedVariant.stock} available
                </span>
                            )}
                        </div>
                    </div>

                    {/* CTA */}
                    {isOutOfStock ? (
                        <div className="rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-center font-semibold">
                            Out of Stock
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            <button
                                onClick={handleBuyNow}
                                className="w-full px-6 py-4 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-bold shadow-xl hover:scale-[1.02] transition"
                            >
                                Buy Now
                            </button>

                            <button
                                onClick={handleAddToCart}
                                className="w-full px-6 py-4 rounded-full border border-zinc-300 dark:border-white/10 font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            >
                                {addedToCart ? "✔ Added to Cart" : "Add to Cart"}
                            </button>
                        </div>
                    )}

                    {/* TRUST */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            🔒 Secure Payment
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            🚚 Fast Delivery
                        </div>
                    </div>

                    {/* METADATA */}
                    {product.metadata && Object.keys(product.metadata).length > 0 && (
                        <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 p-4 text-zinc-900 dark:text-zinc-100">
                            <h3 className="font-semibold mb-3">Product Details</h3>

                            <ul className="space-y-2 text-sm">
                                {Object.entries(product.metadata).map(([key, value]) => (
                                    <li key={key} className="flex gap-2">
                    <span className="font-medium capitalize min-w-[120px] text-zinc-700 dark:text-zinc-300">
                      {key}
                    </span>
                                        <span className="text-zinc-600 dark:text-zinc-400">
                      {String(value)}
                    </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ProductDetail;
