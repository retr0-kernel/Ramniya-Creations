import { useEffect, useRef } from "react";

interface ConfirmOverlayProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmOverlay({
                                           onCancel,
                                           onConfirm,
                                       }: ConfirmOverlayProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);

    // Close on outside click & ESC
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(e.target as Node)
            ) {
                onCancel();
            }
        };

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, [onCancel]);

    return (
        <div className="fixed inset-0 mt-[300px] z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-md">
            {/* Modal */}
            <div
                ref={modalRef}
                className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95"
            >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Sign out?
                </h3>

                <p className="text-sm text-zinc-500 mb-6">
                    Are you sure you want to sign out of your account?
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
