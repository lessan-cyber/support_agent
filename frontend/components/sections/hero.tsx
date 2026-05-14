
import Link from 'next/link';

import Spline from '@splinetool/react-spline/next';
import { ScrollToDemoBtn } from '../ui/scroll-to-demo-btn';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-7xl mx-auto w-full flex flex-row items-center justify-center">
        <div className="text-center space-y-8">
          {/* Chatbot Illustration */}
          <div className="relative w-60 h-60 mx-auto mb-4 ">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-linear-to-b from-cyan-400 via-purple-500 to-transparent rounded-full blur-3xl opacity-60 scale-200" />

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
            <Link href="/dashboard" className="relative px-8 py-3.5 rounded-full font-medium text-white overflow-hidden group shadow-lg shadow-primary/20">
              <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 transition-transform group-hover:scale-105" />
              <span className="relative">Get Started</span>
          </Link>
            
            <ScrollToDemoBtn />
          </div>
        </div>
      </div>

    </section>
  );
}

