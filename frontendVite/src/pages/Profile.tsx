import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { formatDateTime } from "../utils/formatters";

const Profile: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    if (!user) return null;

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-12">
            <div className="max-w-xl mx-auto">

                {/* Card */}
                <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-2xl p-8">

                    {/* Avatar */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 shadow-xl shadow-yellow-500/40 flex items-center justify-center text-black text-4xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>

                        <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                            {user.name}
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            {user.email}
                        </p>
                    </div>

                    {/* Info */}
                    <div className="space-y-4">

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-500">Account Type</span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 capitalize">
                {user.role}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-500">Email Status</span>
                            {user.is_verified ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  ✔ Verified
                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
                  ⚠ Not Verified
                </span>
                            )}
                        </div>

                        {user.created_at && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">Member Since</span>
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {formatDateTime(user.created_at)}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="my-8 h-px bg-black/5 dark:bg-white/10" />

                    {/* Actions */}
                    <div className="space-y-3">

                        {user.role === "admin" && (
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="w-full px-6 py-3 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold shadow-xl hover:scale-[1.02] transition"
                            >
                                Admin Dashboard
                            </button>
                        )}

                        <button
                            onClick={() => navigate("/orders")}
                            className="w-full px-6 py-3 rounded-full border border-zinc-300 dark:border-white/10 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                            My Orders
                        </button>

                        <button
                            onClick={() => navigate("/cart")}
                            className="w-full px-6 py-3 rounded-full border border-zinc-300 dark:border-white/10 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                            View Cart
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full px-6 py-3 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Profile;
