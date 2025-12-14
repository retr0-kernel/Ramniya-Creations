import React, { useState } from "react";
import { type ProductsFilter } from "../../types";

interface ProductFiltersProps {
    filters: ProductsFilter;
    onFilterChange: (filters: ProductsFilter) => void;
    onClearFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
                                                           filters,
                                                           onFilterChange,
                                                           onClearFilters,
                                                       }) => {
    const [localFilters, setLocalFilters] = useState<ProductsFilter>(filters);

    const handleChange = (key: keyof ProductsFilter, value: any) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onFilterChange(localFilters);
    };

    const handleClear = () => {
        const reset: ProductsFilter = {
            page: 1,
            limit: 12,
            sort_by: "created_at",
            sort_order: "desc",
        };
        setLocalFilters(reset);
        onClearFilters();
    };

    return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-lg p-5 text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                    🎛 Filters
                </h3>
                <button
                    onClick={handleClear}
                    className="text-xs text-zinc-500 hover:text-amber-300 transition"
                >
                    Clear all
                </button>
            </div>

            {/* ================= PRICE ================= */}
            <div className="mb-8">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-amber-300 mb-4">
                    💰 Price Range
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            Min Price (₹)
                        </label>
                        <input
                            type="number"
                            placeholder="0"
                            value={localFilters.min_price ? localFilters.min_price / 100 : ""}
                            onChange={(e) =>
                                handleChange(
                                    "min_price",
                                    e.target.value ? parseInt(e.target.value, 10) * 100 : undefined
                                )
                            }
                            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-black/5 dark:border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/40 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            Max Price (₹)
                        </label>
                        <input
                            type="number"
                            placeholder="100000"
                            value={localFilters.max_price ? localFilters.max_price / 100 : ""}
                            onChange={(e) =>
                                handleChange(
                                    "max_price",
                                    e.target.value ? parseInt(e.target.value, 10) * 100 : undefined
                                )
                            }
                            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-black/5 dark:border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/40 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* ================= ATTRIBUTES ================= */}
            <div className="mb-8">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-amber-300 mb-4">
                    📏 Attributes
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            Size
                        </label>
                        <select
                            value={localFilters.size || ""}
                            onChange={(e) =>
                                handleChange("size", e.target.value || undefined)
                            }
                            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/40 outline-none"
                        >
                            <option value="">All Sizes</option>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            Color
                        </label>
                        <select
                            value={localFilters.color || ""}
                            onChange={(e) =>
                                handleChange("color", e.target.value || undefined)
                            }
                            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/40 outline-none"
                        >
                            <option value="">All Colors</option>
                            <option value="gold">🟡 Gold</option>
                            <option value="silver">⚪ Silver</option>
                            <option value="rose-gold">🌸 Rose Gold</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ================= SORT ================= */}
            <div className="mb-10">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-amber-300 mb-4">
                    🔄 Sort By
                </h4>

                <div className="space-y-4">
                    <select
                        value={localFilters.sort_by || "created_at"}
                        onChange={(e) => handleChange("sort_by", e.target.value)}
                        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/40 outline-none"
                    >
                        <option value="created_at">⭐ Newest First</option>
                        <option value="price">💵 Price</option>
                        <option value="title">🔤 Name</option>
                    </select>

                    <select
                        value={localFilters.sort_order || "desc"}
                        onChange={(e) =>
                            handleChange("sort_order", e.target.value as "asc" | "desc")
                        }
                        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/40 outline-none"
                    >
                        <option value="desc">↓ High to Low</option>
                        <option value="asc">↑ Low to High</option>
                    </select>
                </div>
            </div>

            {/* Apply Button */}
            <button
                onClick={handleApply}
                className="w-full rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold py-3 shadow-xl hover:scale-[1.02] transition"
            >
                Apply Filters
            </button>
        </div>
    );
};

export default ProductFilters;
