import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`relative group ${className}`}>
        
        {/* 1. Animated Glow Border (Holographic effect) */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-700 via-zinc-800 to-red-900/50 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-1000 pointer-events-none"></div>

        {/* 2. Main Container Surface */}
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-2xl h-full flex flex-col">
            
            {/* 3. Tech Corners (Decorative) */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-sm pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 rounded-tr-sm pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 rounded-bl-sm pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-sm pointer-events-none"></div>

            {/* 4. Title Header */}
            {title && (
                <div className="mb-6 border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
                        {/* Optional decorative accent */}
                        <span className="w-1 h-4 bg-red-600 rounded-sm"></span>
                        {title}
                    </h2>
                </div>
            )}

            {/* 5. Content Area */}
            <div className="relative z-10">
                {children}
            </div>
            
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none rounded-lg mix-blend-overlay"></div>
        </div>
    </div>
  );
};