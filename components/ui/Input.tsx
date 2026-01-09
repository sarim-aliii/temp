import React from 'react';


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  return (
    <div className="w-full group">
      <label 
        htmlFor={id} 
        className={`block text-[10px] font-bold font-mono uppercase tracking-widest mb-2 transition-colors duration-300 ${error ? 'text-red-500' : 'text-zinc-500 group-focus-within:text-white'}`}
      >
        {label}
      </label>
      
      <div className="relative">
        <input
          id={id}
          className={`
            w-full bg-zinc-900/50 backdrop-blur-sm border rounded p-3 text-sm font-mono text-white placeholder:text-zinc-700
            transition-all duration-300 focus:outline-none focus:bg-zinc-900/80
            ${error 
                ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' 
                : 'border-white/10 focus:border-white/30 hover:border-white/20'
            }
            ${className}
          `}
          {...props}
        />
        
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-all duration-300 pointer-events-none ${error ? 'border-red-500 opacity-100' : 'border-white opacity-0 group-focus-within:opacity-100'}`} />
      </div>

      {error && (
        <p className="mt-1.5 text-[10px] text-red-500 font-mono tracking-wide animate-pulse">
            ERR :: {error}
        </p>
      )}
    </div>
  );
};