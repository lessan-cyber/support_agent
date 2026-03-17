"use client";

import { useState, useRef, useEffect } from 'react';

export default function Features() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const cards = [
    {
      id: 1,
      title: "Build multi-step agents calling custom tools",
      description: "Create agentic systems on a single screen. Integrate any LLM into your workflows as fast as you can drag-n-drop.",
      buttonText: "Explore AI",
      features: [
        "Update Detected",
        "Running Custom Unit Testing",
        "Update Rolled Back Automatically",
        "IT Team Notified of New Ticket",
        "Custom Unit Testing Failed",
        "Update Installed"
      ]
    },
    {
      id: 2,
      title: "Chat with your own data",
      description: "Use Slack, Teams, SMS, voice, or our embedded chat interface to get accurate answers from your data, create tasks, and complete workflows.",
      buttonText: "Try Chat",
      features: []
    },
    {
      id: 3,
      title: "Self-host everything – including AI models",
      description: "Protect your data by deploying on-prem.",
      buttonText: "Deploy Now",
      features: [
        "Deploy with Docker",
        "Access the entire source code on Github"
      ]
    },
    {
      id: 4,
      title: "Self-host everything – including AI models",
      description: "Protect your data by deploying on-prem.",
      buttonText: "Deploy Now",
      features: [
        "Deploy with Docker",
        "Access the entire source code on Github"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background gradient effect */}
      <div 
        ref={containerRef}
        className="relative min-h-screen"
        style={{
          background: hoveredCard !== null ? 
            `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 70%)` :
            'transparent'
        }}
      >
        {/* Header */}
        <div className="text-center pt-20 pb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            The fast way to actually
          </h1>
          <h2 className="text-5xl md:text-6xl font-bold text-orange-400">
            get AI working in your business
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600/70 ${
                index === 0 ? 'xl:col-span-1' : ''
              } ${
                index === 1 ? 'xl:col-span-1' : ''
              } ${
                index === 2 ? 'xl:col-span-1 xl:col-start-1 xl:row-start-2 xl:col-span-2' : ''
              }`}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 leading-tight">
                  {card.title}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {card.description}
                </p>

                {/* Features list for first card */}
                {card.id === 1 && (
                  <div className="mb-6 space-y-2">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                )}

                {/* Features for third card */}
                {card.id === 3 && (
                  <div className="mb-6 space-y-3">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                )}

                {/* Button */}
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center">
                  {card.buttonText}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                {/* Special content for cards */}
                {card.id === 1 && (
                  <div className="mt-8 relative">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                          </svg>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                )}

                {card.id === 3 && (
                  <div className="mt-6">
                    <div className="inline-block bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                      SELF HOSTED
                    </div>
                  </div>
                )}
              </div>

              {/* Hover glow effect */}
              <div 
                className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                  hoveredCard === card.id ? 'opacity-20' : 'opacity-0'
                }`}
                style={{
                  background: hoveredCard === card.id ? 
                    'radial-gradient(circle at center, rgba(59, 130, 246, 0.3), transparent 70%)' :
                    'transparent'
                }}
              />
            </div>
          ))}
        </div>

        {/* Additional content area */}
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-center">
            <p className="text-gray-400 text-lg">
              Experience the power of AI integration with interactive hover effects
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}