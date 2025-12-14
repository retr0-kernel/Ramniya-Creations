import React, {useEffect, useRef, useState} from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import ThemeToggle from "./ThemeToggle";
import ConfirmOverlay from "../common/ConfirmOverlay";

const Navbar: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const { items } = useAppSelector((state) => state.cart);

    const cartItemsCount = items.reduce((t, i) => t + i.quantity, 0);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const navItem =
        "relative px-4 py-2 rounded-full text-sm font-semibold transition-all";

    const activeNav =
        "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/30";

    const inactiveNav =
        "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10";

    return (
        <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/60 dark:bg-black/50 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="h-18 flex items-center justify-between">

                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="
  h-10 w-10 rounded-full
  bg-gradient-to-br from-zinc-900 via-zinc-800 to-black
  shadow-xl shadow-black/50
  flex items-center justify-center
  text-amber-400 text-lg hover:shadow-2xl hover:shadow-pink-500/60

">
                            ✨
                        </div>

                        <span className="
  text-xl font-bold tracking-wide
  bg-gradient-to-r
  from-amber-300 via-yellow-200 to-amber-400
  bg-clip-text text-transparent hover:drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)]
transition

">
  Ramniya Creations
</span>

                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-3 bg-white/40 dark:bg-white/10 p-2 rounded-full shadow-inner">
                        {[
                            { to: "/", label: "Home" },
                            { to: "/products", label: "Shop" },
                            isAuthenticated && { to: "/orders", label: "Orders" },
                        ]
                            .filter(Boolean)
                            .map((item: any) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `${navItem} ${isActive ? activeNav : inactiveNav}`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">

                        {/* Cart */}
                        <Link to="/cart" className="relative group">
                            <div className="
    p-[2px] rounded-full
    bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500
    shadow-lg shadow-yellow-500/40
    group-hover:shadow-yellow-500/70
    transition
  ">
                                <div className="
      h-11 w-11 rounded-full
      bg-white dark:bg-zinc-900
      flex items-center justify-center
      text-amber-600 dark:text-amber-400
      group-hover:scale-105
      transition
    ">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.2}
                                    >
                                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
                                        <circle cx="9" cy="21" r="1.5" />
                                        <circle cx="20" cy="21" r="1.5" />
                                    </svg>
                                </div>
                            </div>

                            {cartItemsCount > 0 && (
                                <span className="
      absolute -top-1 -right-1
      bg-gradient-to-r from-red-500 to-pink-500
      text-white text-xs font-bold
      px-2 py-0.5 rounded-full
      shadow-lg
    ">
      {cartItemsCount}
    </span>
                            )}
                        </Link>


                        <ThemeToggle />

                        {/* Auth */}
                        {isAuthenticated ? (
                            <div ref={menuRef} className="relative">
                                {/* Avatar */}
                                <button
                                    onClick={() => setOpen((v) => !v)}
                                    className="
          h-11 w-11 rounded-full
          bg-gradient-to-br from-zinc-900 via-black to-zinc-800
          shadow-xl shadow-black/50
          text-amber-300 font-bold
          flex items-center justify-center
          cursor-pointer
          focus:outline-none
        "
                                >
                                    {user?.name?.charAt(0).toUpperCase()}
                                </button>

                                {/* Dropdown */}
                                {open && (
                                    <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-black/5 dark:border-white/10 z-50">
                                        <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
                                            <p className="text-xs text-zinc-500">Signed in as</p>
                                            <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                                                {user?.email}
                                            </p>
                                        </div>

                                        <Link
                                            to="/profile"
                                            onClick={() => setOpen(false)}
                                            className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-zinc-800"
                                        >
                                            My Profile
                                        </Link>

                                        {user?.role === "admin" && (
                                            <>
                                                <div className="px-4 pt-2 text-xs uppercase text-zinc-400">
                                                    Admin
                                                </div>
                                                <Link
                                                    to="/admin/dashboard"
                                                    onClick={() => setOpen(false)}
                                                    className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-zinc-800"
                                                >
                                                    Dashboard
                                                </Link>
                                            </>
                                        )}

                                        <button
                                            onClick={() => setConfirmOpen(true)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-b-2xl"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}

                                {/* ================= CONFIRM SIGN OUT ================= */}
                                {confirmOpen && (
                                    <ConfirmOverlay
                                        onCancel={() => setConfirmOpen(false)}
                                        onConfirm={handleLogout}
                                    />
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="
    text-sm font-semibold
    text-zinc-700 dark:text-zinc-300
    hover:text-black dark:hover:text-white
    transition
  "
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/register"
                                    className="
    px-5 py-2 rounded-full
    bg-gradient-to-br from-zinc-900 via-black to-zinc-800
    text-amber-300 font-bold text-sm
    shadow-xl shadow-black/40
    hover:shadow-amber-500/30
    hover:scale-105
    transition
  "
                                >
                                    Register
                                </Link>

                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
