import React, { useEffect, useState } from "react";

const HeroCarousel: React.FC = () => {
    const items = ["💍", "📿", "👑", "💎", "✨"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, 2500); // auto-scroll every 2.5s

        return () => clearInterval(interval);
    }, [items.length]);

    return (
        <div className="relative aspect-square rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
            {items.map((item, i) => (
                <div
                    key={i}
                    className={`
                        absolute inset-0 flex items-center justify-center
                        text-8xl transition-all duration-700 ease-out
                        ${i === index ? "opacity-100 scale-100" : "opacity-0 scale-90"}
                    `}
                >
                    {item}
                </div>
            ))}
        </div>
    );
};

export default HeroCarousel;
