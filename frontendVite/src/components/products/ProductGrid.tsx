import React from "react";
import ProductCard from "./ProductCard";
import { type Product } from "../../types";

interface ProductGridProps {
    products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="text-zinc-400"
                    >
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                    </svg>
                </div>

                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    No Products Found
                </h3>

                <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                    We’re working on adding new handcrafted products.
                    Please check back soon ✨
                </p>
            </div>
        );
    }

    return (
        <div
            className="
        grid gap-8
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
      "
        >
            {products.map((product) => (
                <div
                    key={product.id}
                    className="group transition-transform duration-300 hover:-translate-y-1"
                >
                    <ProductCard product={product} />
                </div>
            ))}
        </div>
    );
};

export default ProductGrid;
