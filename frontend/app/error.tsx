"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white dark:from-[#020617] dark:to-[#0f172a] relative overflow-hidden transition-colors duration-300">
      {/* Background Effects */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100,116,139,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100,116,139,0.08) 1px, transparent 1px),
            radial-gradient(circle at 20% 30%, rgba(239,68,68,0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(249,115,22,0.05) 0%, transparent 50%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%, 100% 100%",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Error Icon with Animation */}
          <div className="relative inline-flex">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-600/20 rounded-full blur-3xl animate-pulse" />
            
            {/* Icon Container */}
            <div className="relative bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950/50 dark:to-orange-950/50 rounded-full p-8 border-2 border-red-200 dark:border-red-800/50 shadow-2xl">
              <AlertTriangle className="w-24 h-24 text-red-600 dark:text-red-400" strokeWidth={1.5} />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white transition-colors">
              Oops! Something went wrong
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-gray-300 max-w-xl mx-auto transition-colors">
              We encountered an unexpected error. Don&apos;t worry, our team has been notified and we&apos;re working on it.
            </p>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-left">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={reset}
              className="group relative px-8 py-3.5 rounded-full font-semibold text-white overflow-hidden shadow-xl shadow-red-500/30 dark:shadow-red-500/20 transition-all hover:shadow-2xl hover:shadow-red-500/40 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 transition-transform group-hover:scale-105" />
              <span className="relative flex items-center justify-center gap-2">
                <RefreshCcw className="w-5 h-5" />
                Try Again
              </span>
            </button>
            
            <a
              href="/"
              className="px-8 py-3.5 rounded-full font-semibold text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100/50 dark:hover:bg-white/5 backdrop-blur-sm w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go Home
            </a>
          </div>

          {/* Additional Help Text */}
          <p className="text-sm text-slate-500 dark:text-slate-400 pt-4">
            If this problem persists, please{" "}
            <a
              href="/contact"
              className="text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              contact support
            </a>
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl" />
    </div>
  );
}
