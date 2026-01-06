import Header from "@/components/layout/header";
import Hero from "@/components/sections/hero";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white dark:from-[#020617] dark:to-[#0f172a] relative overflow-x-hidden transition-colors duration-300">
      {/* Light Mode Background */}
      <div
        className="absolute inset-0 z-0 dark:hidden"
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
      
      {/* Dark Mode Background */}
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(71,85,105,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(71,85,105,0.15) 1px, transparent 1px),
            radial-gradient(circle at 20% 30%, rgba(139,92,246,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6,182,212,0.08) 0%, transparent 50%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%, 100% 100%",
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <Header />
        <Hero />
      </div>
    </div>
  );
}

