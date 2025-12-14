import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { register, clearError } from "../features/auth/authSlice";
import {
    isValidEmail,
    isValidPassword,
    getPasswordStrength,
} from "../utils/validators";
import axios from "../api/axiosConfig";
import { API_ENDPOINTS } from "../api/endpoints";

const Register: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>(
        {}
    );
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] =
        useState<"weak" | "medium" | "strong">("weak");

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    useEffect(() => {
        if (formData.password) {
            setPasswordStrength(getPasswordStrength(formData.password));
        }
    }, [formData.password]);

    const validate = () => {
        const errors: Record<string, string> = {};

        if (formData.name.trim().length < 2) {
            errors.name = "Name must be at least 2 characters";
        }
        if (!isValidEmail(formData.email)) {
            errors.email = "Invalid email address";
        }
        if (!isValidPassword(formData.password)) {
            errors.password =
                "Password must be 8+ chars with uppercase, lowercase & number";
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const result = await dispatch(
            register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            })
        );

        if (register.fulfilled.match(result)) {
            setSuccess(true);
            setTimeout(() => navigate("/login"), 5000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validationErrors[e.target.name]) {
            setValidationErrors({ ...validationErrors, [e.target.name]: "" });
        }
    };

    const strengthColor = {
        weak: "bg-red-500",
        medium: "bg-yellow-400",
        strong: "bg-emerald-500",
    }[passwordStrength];

    const strengthPercent = {
        weak: "w-1/3",
        medium: "w-2/3",
        strong: "w-full",
    }[passwordStrength];

    const handleGoogleLogin = async () => {
        const res = await axios.get(API_ENDPOINTS.GOOGLE_OAUTH);
        window.location.href = res.data.auth_url;
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center px-4">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 flex items-center justify-center text-xl shadow-xl">
                            ✨
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                            Create Account
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1">
                            Join us to start shopping
                        </p>
                    </div>

                    {/* Alerts */}
                    {success && (
                        <div className="mb-6 rounded-xl bg-emerald-500/10 text-emerald-400 px-4 py-3 text-sm">
                            <strong>Registration successful!</strong>
                            <p className="text-xs mt-1">
                                Please verify your email. Redirecting to login…
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            { name: "name", label: "Full Name", type: "text" },
                            { name: "email", label: "Email Address", type: "email" },
                        ].map((f) => (
                            <div key={f.name}>
                                <label className="block text-sm text-zinc-300 mb-1">
                                    {f.label}
                                </label>
                                <input
                                    type={f.type}
                                    name={f.name}
                                    value={(formData as any)[f.name]}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-zinc-900/70 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-400/40 outline-none"
                                />
                                {validationErrors[f.name] && (
                                    <p className="text-xs text-red-400 mt-1">
                                        {validationErrors[f.name]}
                                    </p>
                                )}
                            </div>
                        ))}

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full rounded-xl bg-zinc-900/70 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-400/40 outline-none"
                            />

                            {formData.password && (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${strengthColor} ${strengthPercent} transition-all`}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Strength:{" "}
                                        <span className="font-semibold uppercase">
                      {passwordStrength}
                    </span>
                                    </p>
                                </div>
                            )}

                            {validationErrors.password && (
                                <p className="text-xs text-red-400 mt-1">
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Confirm */}
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full rounded-xl bg-zinc-900/70 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-400/40 outline-none"
                            />
                            {validationErrors.confirmPassword && (
                                <p className="text-xs text-red-400 mt-1">
                                    {validationErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-amber-300 font-semibold py-3 shadow-xl hover:scale-[1.02] transition disabled:opacity-60"
                        >
                            {loading ? "Creating account…" : "Create Account"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-zinc-500">OR</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full flex items-center justify-center gap-3 rounded-full bg-white text-black py-3 font-semibold hover:bg-zinc-100 transition"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Footer */}
                    <p className="text-center text-sm text-zinc-400 mt-6">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-amber-300 font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default Register;
