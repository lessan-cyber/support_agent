"use client";

export function ScrollToDemoBtn() {
    const handleClick = () => {
        document
            .getElementById("aha-demo")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
            });
    };

    return (
        <button
            onClick={handleClick}
            className="px-8 py-3.5 rounded-full font-semibold text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100/50 dark:hover:bg-white/5 backdrop-blur-sm"
        >
            Request a Demo
        </button>
    );
}
