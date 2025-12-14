import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative  bg-gradient-to-br from-black via-zinc-900 to-black text-zinc-300">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-4">
                {/* Brand */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                        Ramniya Creations
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        Exquisite handcrafted jewelry and traditional Indian handicrafts,
                        curated with heritage and precision.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="mb-4 text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                        Quick Links
                    </h4>
                    <ul className="space-y-2 text-sm">
                        {[
                            { to: "/", label: "Home" },
                            { to: "/products", label: "Shop" },
                            { to: "/cart", label: "Cart" },
                        ].map((l) => (
                            <li key={l.to}>
                                <Link
                                    to={l.to}
                                    className="hover:text-amber-300 transition"
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Customer */}
                <div>
                    <h4 className="mb-4 text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                        Customer
                    </h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link to="/orders" className="hover:text-amber-300 transition">
                                Orders
                            </Link>
                        </li>
                        <li>
                            <Link to="/profile" className="hover:text-amber-300 transition">
                                My Account
                            </Link>
                        </li>
                        <li className="text-zinc-400">Help & Support</li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="mb-4 text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                        Contact
                    </h4>
                    <ul className="space-y-3 text-sm text-zinc-400">
                        <li className="flex items-center gap-2">
                            📧 ramniyacreations@gmail.com
                        </li>
                        <li className="flex items-center gap-2">
                            📞 +91-7774077058
                        </li>
                        <li className="flex items-center gap-2">
                            📍 Noida, Uttar Pradesh
                        </li>
                    </ul>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
                    © {currentYear} Ramniya Creations. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
