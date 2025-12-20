import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    );
    const [message, setMessage] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            handleCallback();
        }, 2000); // ⏳ intentional wait (2 sec)

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCallback = async () => {
        const accessToken = searchParams.get("access_token");
        const userId = searchParams.get("user_id");
        const userName = searchParams.get("user_name");
        const userEmail = searchParams.get("user_email");
        const userRole = searchParams.get("user_role");
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setMessage(getErrorMessage(error));
            setTimeout(() => navigate("/login"), 3000);
            return;
        }

        if (!accessToken || !userId || !userEmail) {
            setStatus("error");
            setMessage("Invalid OAuth callback. Missing required data.");
            setTimeout(() => navigate("/login"), 3000);
            return;
        }

        try {
            const user = {
                id: userId,
                name: userName || "",
                email: userEmail,
                role: userRole || "customer",
                is_verified: true,
            };

            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("user", JSON.stringify(user));

            setStatus("success");
            setMessage("You are now signed in. Redirecting to home…");

            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } catch (e) {
            console.error(e);
            setStatus("error");
            setMessage("Authentication failed. Please try again.");
            setTimeout(() => navigate("/login"), 3000);
        }
    };

    const getErrorMessage = (error: string): string => {
        const map: Record<string, string> = {
            missing_code: "Authorization code is missing",
            missing_state: "Security validation failed",
            invalid_state: "Invalid authentication state",
            exchange_failed: "Token exchange failed",
            email_not_verified: "Your Google email is not verified",
            user_creation_failed: "Failed to create user account",
            token_generation_failed: "Token generation failed",
        };
        return map[error] || "Authentication failed";
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-950 px-6">
            <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl p-8 text-center">

                {/* LOADING */}
                {status === "loading" && (
                    <>
                        <div className="mx-auto mb-6 h-16 w-16 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            Completing sign in
                        </h2>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
                            Please wait while we securely authenticate your account
                        </p>
                    </>
                )}

                {/* SUCCESS */}
                {status === "success" && (
                    <>
                        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="2"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-emerald-600">
                            Login Successful
                        </h2>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
                            {message}
                        </p>
                    </>
                )}

                {/* ERROR */}
                {status === "error" && (
                    <>
                        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-red-500">
                            Authentication Failed
                        </h2>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
                            {message}
                        </p>
                        <p className="mt-4 text-xs text-zinc-400">
                            Redirecting to login…
                        </p>
                    </>
                )}
            </div>
        </main>
    );
};

export default OAuthCallback;
