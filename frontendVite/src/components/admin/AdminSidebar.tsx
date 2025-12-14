import React from "react";
import { Link, useLocation } from "react-router-dom";

const AdminSidebar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) =>
        location.pathname === path ||
        (path !== "/" && location.pathname.startsWith(path));

    const menuItems = [
        {
            path: "/admin/dashboard",
            label: "Dashboard",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
        },
        {
            path: "/admin/orders",
            label: "Orders",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
            ),
        },
        {
            path: "/admin/products",
            label: "Products",
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
            ),
        },
    ];

    return (
        <aside
            className="
        fixed top-16 left-0 h-screen w-[260px]
        bg-white/80 dark:bg-zinc-950/80
        backdrop-blur-xl
        border-r border-black/5 dark:border-white/10
        px-4 py-6
        flex flex-col
      "
        >
            {/* BRAND */}
            <div className="px-2 mb-10">
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                    Admin Panel
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Control Center
                </p>
            </div>

            {/* NAV */}
            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                group flex items-center gap-3
                px-4 py-3 rounded-xl
                transition-all duration-200
                ${
                                active
                                    ? "bg-gradient-to-r from-amber-400/20 to-yellow-300/10 text-amber-600 dark:text-amber-400"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                            }
              `}
                        >
                            {/* ICON */}
                            <span
                                className={`
                  flex items-center justify-center
                  ${
                                    active
                                        ? "text-amber-500"
                                        : "group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                                }
                `}
                            >
                {item.icon}
              </span>

                            {/* LABEL */}
                            <span className="font-medium text-sm">
                {item.label}
              </span>

                            {/* ACTIVE INDICATOR */}
                            {active && (
                                <span className="ml-auto h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* FOOTER */}
            <div className="pt-6 border-t border-black/5 dark:border-white/10">
                <Link
                    to="/"
                    className="
            flex items-center gap-3 px-4 py-3 rounded-xl
            text-zinc-600 dark:text-zinc-400
            hover:bg-zinc-100 dark:hover:bg-zinc-900
            hover:text-zinc-900 dark:hover:text-zinc-100
            transition
          "
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-sm font-medium">Back to Store</span>
                </Link>
            </div>
        </aside>
    );
};

export default AdminSidebar;
