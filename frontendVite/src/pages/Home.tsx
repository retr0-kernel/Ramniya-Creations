import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchProducts } from "../features/products/productsSlice";
import ProductGrid from "../components/products/ProductGrid";
import Spinner from "../components/common/Spinner";
import HeroCarousel from "../pages/HeroCarousel.tsx";

const Home: React.FC = () => {
    const dispatch = useAppDispatch();
    const { products, loading } = useAppSelector((state) => state.products);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (!hasLoaded && products.length === 0) {
            dispatch(
                fetchProducts({
                    page: 1,
                    limit: 8,
                    sort_by: "created_at",
                    sort_order: "desc",
                })
            );
            setHasLoaded(true);
        }
    }, [dispatch, hasLoaded, products.length]);

    return (
        <main className="bg-white dark:bg-black">

            {/* ================= HERO ================= */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
                <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
                <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
                    {/* Text */}
                    <div className="space-y-6">
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                            Exquisite Indian Jewelry & Handicrafts
                        </h1>

                        <p className="text-lg text-zinc-300 max-w-xl">
                            Handcrafted gold jewelry, traditional ornaments and timeless
                            Indian handicrafts — curated with heritage and precision.
                        </p>

                        <div className="flex gap-4">
                            <Link
                                to="/products"
                                className="px-6 py-3 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold shadow-xl shadow-black/50 hover:scale-105 transition"
                            >
                                Explore Collection →
                            </Link>

                            <Link
                                to="/register"
                                className="px-6 py-3 rounded-full border border-amber-400/40 text-amber-300 hover:bg-amber-400/10 transition"
                            >
                                Join Now
                            </Link>
                        </div>
                    </div>

                    {/* Visual */}
                    {/* Visual */}
                    <div className="relative">
                        <HeroCarousel />
                    </div>

                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section className="py-20 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: "💎",
                            title: "Premium Quality",
                            desc: "Crafted using finest materials and traditional artistry",
                        },
                        {
                            icon: "🔒",
                            title: "Secure Payments",
                            desc: "Trusted Razorpay payments with complete security",
                        },
                        {
                            icon: "🚚",
                            title: "Fast Delivery",
                            desc: "Reliable and quick shipping across India",
                        },
                    ].map((f, i) => (
                        <div
                            key={i}
                            className="group rounded-2xl p-8 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg hover:-translate-y-2 transition"
                        >
                            <div className="text-4xl mb-4">{f.icon}</div>
                            <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-amber-300">
                                {f.title}
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= PRODUCTS ================= */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2
                            className="
    text-3xl font-bold tracking-tight
    text-zinc-900
    dark:bg-gradient-to-r dark:from-amber-300 dark:to-yellow-300
    dark:bg-clip-text dark:text-transparent
  "
                        >
                            Featured Products
                        </h2>

                        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                            Discover our latest handcrafted pieces
                        </p>

                    </div>

                    {loading ? (
                        <Spinner fullScreen />
                    ) : (
                        <>
                            <ProductGrid products={products} />

                            {products.length > 0 && (
                                <div className="text-center mt-16">
                                    <Link
                                        to="/products"
                                        className="inline-block px-8 py-3 rounded-full border border-zinc-900 dark:border-amber-400 text-zinc-900 dark:text-amber-300 hover:bg-zinc-900 hover:text-white dark:hover:bg-amber-400 dark:hover:text-black transition"
                                    >
                                        View All Products
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* ================= CTA ================= */}
            <section className="py-24 bg-gradient-to-br from-black via-zinc-900 to-black text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent mb-4">
                    Start Your Journey Today
                </h2>
                <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                    Join thousands of customers who trust us for authentic Indian
                    craftsmanship.
                </p>
                <Link
                    to="/register"
                    className="px-8 py-4 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-bold shadow-xl hover:scale-105 transition"
                >
                    Create Account
                </Link>
            </section>
        </main>
    );
};

export default Home;
