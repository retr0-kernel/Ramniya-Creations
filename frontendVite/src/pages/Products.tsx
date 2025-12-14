import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
    fetchProducts,
    setFilters,
    clearFilters,
} from "../features/products/productsSlice";
import ProductGrid from "../components/products/ProductGrid";
import ProductFilters from "../components/products/ProductFilters";
import Spinner from "../components/common/Spinner";
import ErrorAlert from "../components/common/ErrorAlert";

const Products: React.FC = () => {
    const dispatch = useAppDispatch();
    const { products, loading, error, filters, pagination } = useAppSelector(
        (state) => state.products
    );

    useEffect(() => {
        dispatch(fetchProducts(filters));
    }, [dispatch, filters]);

    const handleFilterChange = (newFilters: any) => {
        dispatch(setFilters({ ...newFilters, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        dispatch(setFilters({ ...filters, page }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
    };

    return (
        <main className="bg-white dark:bg-black min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* ================= HEADER ================= */}
                <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                            Our Collection
                        </h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-xl">
                            Discover exquisite handcrafted jewelry and traditional Indian
                            handicrafts
                        </p>
                    </div>

                    {!loading && pagination && (
                        <span className="px-4 py-2 rounded-full bg-amber-400/10 text-amber-300 text-sm font-semibold">
              {pagination.total || 0} Product
                            {pagination.total !== 1 ? "s" : ""}
            </span>
                    )}
                </div>

                {/* ================= CONTENT ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

                    {/* Filters */}
                    <aside className="lg:sticky lg:top-28 h-fit">
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg p-4">
                            <ProductFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={handleClearFilters}
                            />
                        </div>
                    </aside>

                    {/* Products */}
                    <section>
                        {error && <ErrorAlert error={error} />}

                        {loading ? (
                            <div className="flex items-center justify-center min-h-[400px]">
                                <Spinner />
                            </div>
                        ) : (
                            <>
                                <ProductGrid products={products} />

                                {/* ================= PAGINATION ================= */}
                                {pagination && pagination.total_pages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-16 flex-wrap">
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={!pagination.has_previous}
                                            className="px-3 py-2 rounded-full border border-zinc-300 dark:border-white/10 disabled:opacity-40"
                                        >
                                            ⟪
                                        </button>

                                        <button
                                            onClick={() =>
                                                handlePageChange(pagination.page - 1)
                                            }
                                            disabled={!pagination.has_previous}
                                            className="px-3 py-2 rounded-full border border-zinc-300 dark:border-white/10 disabled:opacity-40"
                                        >
                                            ‹
                                        </button>

                                        {Array.from(
                                            { length: Math.min(5, pagination.total_pages) },
                                            (_, i) => {
                                                const page = Math.max(
                                                    1,
                                                    Math.min(
                                                        pagination.page - 2 + i,
                                                        pagination.total_pages - 4
                                                    )
                                                );

                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition
                              ${
                                                            page === pagination.page
                                                                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg"
                                                                : "border border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                        }
                            `}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            }
                                        )}

                                        <button
                                            onClick={() =>
                                                handlePageChange(pagination.page + 1)
                                            }
                                            disabled={!pagination.has_next}
                                            className="px-3 py-2 rounded-full border border-zinc-300 dark:border-white/10 disabled:opacity-40"
                                        >
                                            ›
                                        </button>

                                        <button
                                            onClick={() =>
                                                handlePageChange(pagination.total_pages)
                                            }
                                            disabled={!pagination.has_next}
                                            className="px-3 py-2 rounded-full border border-zinc-300 dark:border-white/10 disabled:opacity-40"
                                        >
                                            ⟫
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
};

export default Products;
