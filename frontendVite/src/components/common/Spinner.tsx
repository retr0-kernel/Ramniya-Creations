import React from "react";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "secondary" | "light";
    fullScreen?: boolean;
}

const sizeMap = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
};

const colorMap = {
    primary: "border-amber-400 border-t-transparent",
    secondary: "border-zinc-400 border-t-transparent",
    light: "border-white border-t-transparent",
};

const Spinner: React.FC<SpinnerProps> = ({
                                             size = "md",
                                             variant = "primary",
                                             fullScreen = false,
                                         }) => {
    const spinner = (
        <div
            role="status"
            aria-label="Loading"
            className={`
        animate-spin rounded-full
        ${sizeMap[size]}
        ${colorMap[variant]}
      `}
        >
            <span className="sr-only">Loading...</span>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default Spinner;
