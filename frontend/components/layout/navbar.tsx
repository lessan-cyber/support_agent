"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import React from "react";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-400 via-purple-500 to-purple-600 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-full h-full bg-linear-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
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
                {/* Mobile navigation */}
        <div className="md:hidden">
          <button className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2">
              <NavLink href="/" active>
                Home
              </NavLink>
              <NavLink href="/about">About Us</NavLink>
              <NavLink href="/features">Features</NavLink>
              <NavLink href="/pricing">Pricing</NavLink>
              <NavLink href="/contact">Contact Us</NavLink>
              <Link href="/dashboard" className="relative px-6 py-2.5 rounded-full font-medium text-white overflow-hidden group shadow-lg shadow-primary/20">
              <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 transition-transform group-hover:scale-105" />
              <span className="relative">Get Started</span>
              </Link>
            </div>
          )}
        </div>

        
        {/* CTA Button & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
            <Link href="/dashboard" className="hidden md:flex relative px-6 py-2.5 rounded-full font-medium text-white overflow-hidden group shadow-lg shadow-primary/20">
              <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 transition-transform group-hover:scale-105" />
              <span className="relative">Get Started</span>
            </Link>
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
