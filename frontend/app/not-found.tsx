import Link from "next/link";
import { ArrowLeft, Home, Search, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-linear-to-b from-slate-50 to-white dark:from-[#020617] dark:to-[#0f172a] relative overflow-hidden transition-colors duration-300">
      {/* Background Effects */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100,116,139,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100,116,139,0.08) 1px, transparent 1px),
            radial-gradient(circle at 20% 30%, rgba(139,92,246,0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6,182,212,0.03) 0%, transparent 50%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%, 100% 100%",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-3xl w-full text-center space-y-8">
          {/* 404 Animation */}
          <div className="relative inline-block">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-linear-to-r from-cyan-400/20 via-purple-500/20 to-blue-600/20 rounded-3xl blur-3xl animate-pulse" />
            
            {/* 404 Text */}
            <div className="relative">
              <h1 className="text-[12rem] md:text-[16rem] font-black leading-none">
                <span className="bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  404
                </span>
              </h1>
              
              {/* Floating Question Mark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="animate-bounce">
                  <HelpCircle className="w-16 h-16 md:w-24 md:h-24 text-purple-500/30 dark:text-purple-400/30" strokeWidth={1} />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white transition-colors">
              Page Not Found
            </h2>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
              Oops! The page you&apos;re looking for seems to have wandered off into the digital void. 
              Let&apos;s get you back on track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="group relative px-8 py-3.5 rounded-full font-semibold text-white overflow-hidden shadow-xl shadow-purple-500/30 dark:shadow-purple-500/20 transition-all hover:shadow-2xl hover:shadow-purple-500/40 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 transition-transform group-hover:scale-105" />
              <span className="relative flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </span>
            </Link>
            
            <Link
              href="/"
              className="px-8 py-3.5 rounded-full font-semibold text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100/50 dark:hover:bg-white/5 backdrop-blur-sm w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-8 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Or try one of these helpful links:
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/about"
                className="text-sm text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline-offset-4 hover:underline"
              >
                About Us
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                href="/features"
                className="text-sm text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline-offset-4 hover:underline"
              >
                Features
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                href="/contact"
                className="text-sm text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline-offset-4 hover:underline"
              >
                Contact Support
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                href="/pricing"
                className="text-sm text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline-offset-4 hover:underline"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Search Suggestion */}
          <div className="pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Try searching for what you need
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-20 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl" />
    </div>
  );
}
