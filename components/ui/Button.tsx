import React from 'react';
import { Loader } from './Loader';


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading = false,
  disabled,
  ...props 
}) => {
  const baseClasses = 'relative px-6 py-3 rounded font-mono text-xs font-bold tracking-widest uppercase transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 group overflow-hidden';
  
  const variantClasses = {
    // High contrast (White on Black) - Used for main actions
    primary: 'bg-white text-black hover:bg-zinc-200 focus:ring-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)]',
    
    // Subtle (Dark Zinc) - Used for secondary actions
    secondary: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 focus:ring-zinc-600',
    
    // Alert (Red) - Used for destructive actions
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_-5px_rgba(220,38,38,0.7)]',
    
    // Ghost (Transparent) - Used for tertiary actions
    ghost: 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/5 focus:ring-zinc-500',
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      disabled={isLoading || disabled}
      {...props}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
      )}

      {isLoading ? (
        <>
           <span className="opacity-0">{children}</span>
           <div className="absolute inset-0 flex items-center justify-center">
               <Loader spinnerClassName={`w-4 h-4 ${variant === 'primary' ? 'text-black' : 'text-current'}`} />
           </div>
        </>
      ) : (
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      )}
    </button>
  );
};