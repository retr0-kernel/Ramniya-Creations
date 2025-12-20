import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axiosConfig";
import { API_ENDPOINTS } from "../../api/endpoints";
import Spinner from "../../components/common/Spinner";
import { formatPrice, formatDateTime } from "../../utils/formatters";
import { Product } from "../../types";

/* =======================
   ADMIN PRODUCTS
======================= */

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${API_ENDPOINTS.PRODUCTS}?page=${page}&limit=20&sort_by=created_at&sort_order=desc`
            );
            setProducts(res.data.products || []);
            setTotalPages(res.data.pagination?.total_pages || 1);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product permanently?")) return;
        await axios.delete(API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id));
        fetchProducts();
    };

    const filtered = products.filter((p) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            p.title.toLowerCase().includes(s) ||
            p.description.toLowerCase().includes(s) ||
            p.id.toLowerCase().includes(s)
        );
    });

    if (loading && products.length === 0) return <Spinner fullScreen />;

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                            Products
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Manage your product catalog
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-6 py-3 rounded-full bg-gradient-to-br from-zinc-900 to-black text-amber-300 font-semibold shadow-lg hover:scale-[1.03] transition"
                    >
                        + Create Product
                    </button>
                </div>

                {/* SEARCH */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-xl p-5">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product name, description or ID"
                        className="
              w-full rounded-full px-5 py-3
              bg-zinc-100 dark:bg-zinc-800
              border border-black/5 dark:border-white/10
              text-sm
              text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400
            "
                    />
                </div>

                {/* TABLE */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-xl overflow-hidden">

                    {/* HEADER */}
                    <div className="grid grid-cols-[80px_1.5fr_120px_120px_120px_160px] gap-4 px-6 py-4 text-xs font-semibold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        <div>Image</div>
                        <div>Product</div>
                        <div>Price</div>
                        <div>Variants</div>
                        <div>Images</div>
                        <div>Actions</div>
                    </div>

                    {/* BODY */}
                    {loading ? (
                        <div className="py-16 text-center">
                            <Spinner />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center text-zinc-500 dark:text-zinc-400">
                            No products found
                        </div>
                    ) : (
                        filtered.map((p) => {
                            const images = p.images || [];
                            const variants = p.variants || [];
                            const primary = images.find((i) => i.is_primary) || images[0];

                            return (
                                <div
                                    key={p.id}
                                    className="grid grid-cols-[80px_1.5fr_120px_120px_120px_160px] gap-4 px-6 py-4 items-center border-t border-black/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                                >
                                    {/* IMAGE */}
                                    <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                        {primary ? (
                                            <img
                                                src={primary.url}
                                                alt={p.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) =>
                                                    ((e.target as HTMLImageElement).src =
                                                        "/placeholder.jpg")
                                                }
                                            />
                                        ) : null}
                                    </div>

                                    {/* PRODUCT */}
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            {p.title}
                                        </p>
                                        <p className="text-xs text-zinc-500 line-clamp-2">
                                            {p.description}
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            {formatDateTime(p.created_at)}
                                        </p>
                                    </div>

                                    {/* PRICE */}
                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {formatPrice(p.price)}
                                    </div>

                                    {/* VARIANTS */}
                                    <div className="text-sm">
                                        {variants.length > 0 ? (
                                            <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 text-xs font-semibold">
                        {variants.length} variants
                      </span>
                                        ) : (
                                            <span className="text-zinc-400 text-xs">None</span>
                                        )}
                                    </div>

                                    {/* IMAGES */}
                                    <div className="text-sm">
                    <span className="px-3 py-1 rounded-full bg-zinc-500/15 text-zinc-500 text-xs font-semibold">
                      {images.length} images
                    </span>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/products/${p.id}`}
                                            className="px-3 py-2 rounded-full border text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            View
                                        </Link>

                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="px-3 py-2 rounded-full border border-red-500/30 text-red-500 text-xs hover:bg-red-500/10"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-5 py-2 rounded-full border text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-5 py-2 rounded-full border text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateProductModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => {
                        setShowCreate(false);
                        fetchProducts();
                    }}
                />
            )}
        </main>
    );
};

/* =======================
   CREATE PRODUCT MODAL
======================= */

const CreateProductModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        await axios.post(API_ENDPOINTS.ADMIN_PRODUCTS, {
            title,
            description,
            price: parseInt(price) * 100,
        });
        onSuccess();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-2xl p-8 space-y-5">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Create Product
                </h2>

                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Product title"
                    className="w-full rounded-xl px-4 py-3 bg-zinc-100 dark:bg-zinc-800"
                />

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product description"
                    className="w-full rounded-xl px-4 py-3 bg-zinc-100 dark:bg-zinc-800"
                />

                <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price (₹)"
                    type="number"
                    className="w-full rounded-xl px-4 py-3 bg-zinc-100 dark:bg-zinc-800"
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-full border"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={loading}
                        className="px-6 py-2 rounded-full bg-gradient-to-br from-zinc-900 to-black text-amber-300 font-semibold"
                    >
                        {loading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProducts;
