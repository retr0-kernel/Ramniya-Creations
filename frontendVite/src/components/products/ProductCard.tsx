import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types";
import { formatPrice } from "../../utils/formatters";

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const images = product.images || [];
    const primaryImage = images.find((img) => img.is_primary) || images[0];
    const imageUrl = primaryImage?.url || "/placeholder.jpg";

    const variants = product.variants || [];
    const hasVariants = variants.length > 0;
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

    return (
        <Link to={`/products/${product.id}`} className="group block h-full">
            <div
                className="
          h-full rounded-3xl overflow-hidden
          bg-white dark:bg-zinc-900
          border border-black/5 dark:border-white/10
          shadow-lg hover:shadow-2xl
          transition-all duration-300
          hover:-translate-y-1
        "
            >
                {/* IMAGE */}
                <div className="relative h-[260px] overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="
              h-full w-full object-cover
              transition-transform duration-500
              group-hover:scale-110
            "
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.jpg";
                        }}
                    />

                    {/* Stock Badge */}
                    {hasVariants && (
                        <div className="absolute top-3 left-3">
                            {totalStock > 0 ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/90 text-white">
                  In Stock
                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/90 text-white">
                  Out of Stock
                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {product.title}
                    </h3>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {product.description || "No description available"}
                    </p>

                    <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-bold text-zinc-900 dark:text-amber-300">
              {formatPrice(product.price)}
            </span>

                        {hasVariants && variants.length > 1 && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {variants.length} variants
              </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
