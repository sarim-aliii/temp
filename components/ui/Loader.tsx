import React from 'react';


export const Loader: React.FC<{ spinnerClassName?: string }> = ({ spinnerClassName = 'w-16 h-16' }) => {
  return (
    <div className="flex justify-center items-center" role="status" aria-label="System Processing...">
        <div className={`relative ${spinnerClassName}`}>
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle
                    className="stroke-zinc-800"
                    cx="50" cy="50" r="45"
                    fill="none"
                    strokeWidth="4"
                    opacity="0.5"
                />

                <circle
                    className="stroke-white"
                    style={{ animation: 'spin 3s linear infinite', transformOrigin: '50% 50%' }}
                    cx="50" cy="50" r="45"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="square"
                    strokeDasharray="100 200"
                />

                <circle
                    className="stroke-red-600"
                    style={{ animation: 'spin 1.5s linear infinite reverse', transformOrigin: '50% 50%' }}
                    cx="50" cy="50" r="35"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="square"
                    strokeDasharray="80 200"
                    strokeDashoffset="0"
                />
                
                {/* 4. Core Indicator (Pulsing Center) */}
                <rect
                    x="44" y="44" width="12" height="12"
                    className="fill-white/80 animate-pulse"
                />
            </svg>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    </div>
  );
};