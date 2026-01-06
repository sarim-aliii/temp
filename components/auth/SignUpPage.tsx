import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { SocialButton } from '../ui/SocialButton';
import { UserPlus, Cpu, AlertCircle, ArrowLeft, ScanFace } from 'lucide-react';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
  onSignUpSuccess: (email: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin, onSignUpSuccess }) => {
  const { signup, loginWithGoogle } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Local validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const { 
    execute: createAccount, 
    loading: isLoading, 
    error: apiError 
  } = useApi(signup);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) {
      newErrors.email = 'Identity required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid format.';
    }
    if (!password) {
      newErrors.password = 'Keycode required.';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
        newErrors.password = 'Security level low: Req 8+ chars, Upper, Lower, Num, Special.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Keycodes do not match.';
    }
    
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      await createAccount({ email, password });
      
      // --- FIX: Save email to localStorage for persistence ---
      localStorage.setItem('pendingVerificationEmail', email);
      
      onSignUpSuccess(email);
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white selection:bg-red-500/30 selection:text-red-200 overflow-hidden">

      {/* 1. Global Noise Texture */}
      <div className="fixed inset-0 z-[1] opacity-[0.04] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* 2. Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-zinc-800/20 blur-[120px] rounded-full animate-pulse duration-[8s]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-red-900/10 blur-[150px] rounded-full opacity-30" />
      </div>

      {/* Dot Matrix Overlay */}
      <div className="fixed inset-0 dot-matrix opacity-[0.03] z-0 pointer-events-none" />

      {/* 3. Tech Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-zinc-500">
         <button onClick={onSwitchToLogin} className="flex items-center gap-2 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="font-mono text-xs tracking-[0.2em]">ABORT</span>
        </button>
        <div className="flex gap-2">
            <span className="font-mono text-[10px] hidden sm:block">INITIALIZING_NEW_USER</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-red-500 animate-ping' : 'bg-zinc-600'}`} />
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-md p-6">
        
        {/* Aesthetic Border Container */}
        <div className="relative group">
            {/* Animated Glow Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-700 via-zinc-800 to-red-900 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-2xl">
                
                {/* Header Section */}
                <div className="mb-8 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                        <ScanFace size={20} className="text-white relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">IDENTITY PROTOCOL</h2>
                    <p className="text-sm text-zinc-500 font-mono tracking-wide">ESTABLISH SECURE CONNECTION</p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        id="signup-email"
                        label="Identity (Email)"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={validationErrors.email}
                        disabled={isLoading}
                        autoComplete="email"
                        className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                    />
                    
                    <div className="space-y-4">
                        <Input
                            id="signup-password"
                            label="Set Passcode"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={validationErrors.password}
                            disabled={isLoading}
                            autoComplete="new-password"
                            className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                        <Input
                            id="confirm-password"
                            label="Verify Passcode"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={validationErrors.confirmPassword}
                            disabled={isLoading}
                            autoComplete="new-password"
                            className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                    </div>

                    {/* Error Display Block */}
                    {(validationErrors.form || apiError) && (
                         <div className="p-3 bg-red-900/20 border border-red-500/20 rounded flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-200 font-mono leading-relaxed">
                                {validationErrors.form || apiError}
                            </p>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full h-12 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-mono tracking-widest text-xs font-bold rounded flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <Loader spinnerClassName="w-4 h-4 text-black" /> : (
                            <>
                                <span>INITIALIZE</span>
                                <UserPlus size={14} />
                            </>
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
                        <span className="px-4 bg-zinc-900 text-zinc-600">External Link</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <SocialButton provider="google" onClick={loginWithGoogle} isLoading={false} />
                </div>

                <p className="text-center mt-8 text-zinc-500 text-xs">
                    Existing Identity?{' '}
                    <button type="button" onClick={onSwitchToLogin} className="text-white hover:text-red-400 underline decoration-zinc-700 underline-offset-4 transition-colors">
                        Access Terminal
                    </button>
                </p>
            </div>
            
            {/* Decorative Tech Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 rounded-br-sm"></div>
        </div>

        {/* Footer Metadata */}
        <div className="mt-8 flex justify-center gap-6 opacity-30">
            <div className="flex items-center gap-2">
                <Cpu size={12} />
                <span className="font-mono text-[10px]">BLUR_SYS_REGISTRY</span>
            </div>
        </div>

      </div>
    </div>
  );
};