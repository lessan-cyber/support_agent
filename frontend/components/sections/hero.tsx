import { HeroBackground } from './hero-bg';

import Spline from '@splinetool/react-spline/next';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-7xl mx-auto w-full flex flex-row items-center justify-center">
        <div className="text-center space-y-8">
          {/* Chatbot Illustration */}
          <div className="relative w-60 h-60 mx-auto mb-12 ">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-linear-to-b from-cyan-400 via-purple-500 to-transparent rounded-full blur-3xl opacity-40 scale-150" />

              {/* Spline 3D Model */}
              <div className="absolute inset-0 ">
                <Spline scene="https://prod.spline.design/ty5bZl1oJnRPNDGw/scene.splinecode" />
              </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight transition-colors">
              The Future of The
              <br />
              <span className="bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Next-Gen Ai Powered Chatbot
              </span>
            </h1>
            
            <p className="text-slate-600 dark:text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed transition-colors">
              Meet Chatbot, the next-gen Ai chatbot designer to enhance conversations with intuitive responses, seamless
              integration, and powerful automation.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="relative px-8 py-3.5 rounded-full font-semibold text-white overflow-hidden group shadow-xl shadow-purple-500/30 dark:shadow-purple-500/20 transition-shadow">
              <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 transition-transform group-hover:scale-105" />
              <span className="relative">Get Started</span>
            </button>
            
            <button className="px-8 py-3.5 rounded-full font-semibold text-slate-700 dark:text-gray-300 border-2 border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100/50 dark:hover:bg-white/5 backdrop-blur-sm">
              Request a Demo
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Wave Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 100C240 150 480 180 720 150C960 120 1200 80 1440 100V200H0V100Z"
            className="fill-cyan-500/20"
          />
          <path
            d="M0 120C240 140 480 160 720 140C960 120 1200 100 1440 120V200H0V120Z"
            className="fill-cyan-400/10"
          />
        </svg>
      </div>
    </section>
  );
}

