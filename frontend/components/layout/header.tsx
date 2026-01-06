"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-purple-500 to-purple-600 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white transition-colors">ChatBot</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/" active>
            Home
          </NavLink>
          <NavLink href="/about">About Us</NavLink>
          <NavLink href="/features">Features</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/contact">Contact Us</NavLink>
        </div>

        {/* CTA Button & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="relative px-6 py-2.5 rounded-full font-medium text-white overflow-hidden group shadow-lg shadow-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 transition-transform group-hover:scale-105" />
            <span className="relative">Get Started</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-slate-900/10 text-slate-900 backdrop-blur-sm dark:bg-white/10 dark:text-white"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}
