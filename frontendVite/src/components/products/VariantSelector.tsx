import React from "react";
import { ProductVariant } from "../../types";

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedVariant: ProductVariant | null;
    onSelect: (variant: ProductVariant) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
                                                             variants,
                                                             selectedVariant,
                                                             onSelect,
                                                         }) => {
    if (!variants.length) return null;

    // Collect all attribute keys dynamically (size, color, etc.)
    const attributeKeys = Array.from(
        new Set(variants.flatMap((v) => Object.keys(v.attributes || {})))
    );

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Select Variant
            </h3>

            {attributeKeys.map((key) => {
                const values = Array.from(
                    new Set(variants.map((v) => v.attributes?.[key]))
                );

                return (
                    <div key={key} className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            {key}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {values.map((value) => {
                                const variant = variants.find(
                                    (v) => v.attributes?.[key] === value
                                );

                                if (!variant) return null;

                                const isSelected =
                                    selectedVariant?.attributes?.[key] === value;
                                const isOutOfStock = variant.stock === 0;

                                return (
                                    <button
                                        key={value}
                                        disabled={isOutOfStock}
                                        onClick={() => !isOutOfStock && onSelect(variant)}
                                        className={`
                      px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-200
                      border
                      ${
                                            isSelected
                                                ? "bg-amber-400 text-black border-amber-400 shadow"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-black/10 dark:border-white/10"
                                        }
                      ${
                                            isOutOfStock
                                                ? "opacity-40 cursor-not-allowed line-through"
                                                : "hover:bg-amber-400/20 hover:border-amber-400"
                                        }
                    `}
                                    >
                                        {value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {selectedVariant && (
                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 p-3 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            SKU:
          </span>{" "}
                    {selectedVariant.sku}{" "}
                    <span className="mx-2">•</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Stock:
          </span>{" "}
                    {selectedVariant.stock} available
                </div>
            )}
        </div>
    );
};

export default VariantSelector;
