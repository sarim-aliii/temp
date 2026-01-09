import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import OtpInput from '../ui/OtpInput'; 
import { Loader } from '../ui/Loader';
import { useApi } from '../../hooks/useApi';
import { authApi } from '../../services/api'; 
import { KeyRound, Mail, ArrowLeft, ShieldAlert, CheckCircle2, AlertCircle, Signal } from 'lucide-react';


interface ForgotPasswordPageProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
  onSwitchToSignUp: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSuccess, onSwitchToLogin, onSwitchToSignUp }) => {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [customError, setCustomError] = useState(''); 
  const [successMessage, setSuccessMessage] = useState('');

  // --- API HOOKS ---
  const { 
    execute: sendCode, 
    loading: isSending 
  } = useApi(authApi.forgotPassword);
  const { 
    execute: reset, 
    loading: isResetting 
  } = useApi(authApi.resetPassword);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');
    setSuccessMessage('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setCustomError('Invalid identity format.');
      return;
    }

    try {
      await sendCode({ email });
      setStep(2); 
      setSuccessMessage(`SIGNAL_SENT: ${email}`);
    } 
    catch (err: any) {
       if (err.message?.includes('404') || err.message?.toLowerCase().includes('user not found')) {
         setCustomError("ERR_404: IDENTITY_NOT_FOUND");
       } else if (err.message?.includes('registered with')) {
         setCustomError(`ERR_CONFLICT: ${err.message}`);
       } else {
         setCustomError(err.message || "ERR_TRANSMISSION_FAILED");
       }
    } 
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');

    if (otp.length !== 6) {
        setCustomError("ERR_INVALID_TOKEN: LENGTH_MISMATCH");
        return;
    }
    if (!newPassword) {
        setCustomError("ERR_MISSING_KEY: NEW_PASSWORD");
        return;
    }
    if (newPassword !== confirmPassword) {
        setCustomError("ERR_KEY_MISMATCH");
        return;
    }
    
    try {
      await reset({ email, otp, password: newPassword });
      onSuccess(email); 
      onSwitchToLogin(); 
    } catch (err: any) {
      setCustomError(err.message || "ERR_RESET_FAILED: TOKEN_EXPIRED");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white selection:bg-red-500/30 selection:text-red-200 overflow-hidden">

      {/* 1. Global Noise Texture */}
      <div className="fixed inset-0 z-[1] opacity-[0.04] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* 2. Ambient Background (Red Alert Theme) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] bg-red-900/10 blur-[150px] rounded-full animate-pulse duration-[6s]" />
      </div>

      {/* Dot Matrix Overlay */}
      <div className="fixed inset-0 dot-matrix opacity-[0.03] z-0 pointer-events-none" />

      {/* 3. Tech Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-zinc-500">
         <button onClick={step === 1 ? onSwitchToLogin : () => setStep(1)} className="flex items-center gap-2 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="font-mono text-xs tracking-[0.2em]">BACK</span>
        </button>
        <div className="flex gap-2">
            <span className="font-mono text-[10px] hidden sm:block">RECOVERY_PROTOCOL_V1</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isSending || isResetting ? 'bg-red-500 animate-ping' : 'bg-yellow-600'}`} />
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-md p-6">
        
        {/* Aesthetic Border Container */}
        <div className="relative group">
            {/* Animated Glow Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-b from-red-900 via-zinc-800 to-zinc-900 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-2xl">
                
                {/* Header Section */}
                <div className="mb-8 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2 relative">
                        {step === 1 ? <Signal size={20} className="text-red-500" /> : <KeyRound size={20} className="text-red-500" />}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        {step === 1 ? "SIGNAL RECOVERY" : "OVERRIDE SECURITY"}
                    </h2>
                    <p className="text-sm text-zinc-500 font-mono tracking-wide">
                        {step === 1 ? "INITIATE RESET SEQUENCE" : "ESTABLISH NEW CREDENTIALS"}
                    </p>
                </div>

                {/* Status Messages */}
                {successMessage && (
                    <div className="mb-6 p-3 bg-green-900/20 border border-green-500/20 rounded flex items-center gap-3">
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        <span className="text-xs text-green-200 font-mono">{successMessage}</span>
                    </div>
                )}
                {customError && (
                    <div className="mb-6 p-3 bg-red-900/20 border border-red-500/20 rounded flex items-center gap-3">
                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                        <span className="text-xs text-red-200 font-mono">{customError}</span>
                    </div>
                )}

                {/* FORM AREA */}
                {step === 1 ? (
                   <form onSubmit={handleSendCode} className="space-y-6">
                       <div className="space-y-2">
                           <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                               Target Email Address required for verification signal.
                           </p>
                           <Input
                               id="reset-email"
                               label="Target Identity"
                               type="email"
                               value={email}
                               onChange={(e) => { setEmail(e.target.value); setCustomError(''); }}
                               disabled={isSending}
                               autoComplete="email"
                               className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                           />
                       </div>
                       <Button 
                            type="submit" 
                            disabled={isSending} 
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-mono tracking-widest text-xs font-bold rounded flex items-center justify-center gap-2"
                        >
                           {isSending ? <Loader spinnerClassName="w-4 h-4 text-black" /> : (
                               <>
                                   <span>TRANSMIT CODE</span>
                                   <Mail size={14} />
                               </>
                           )}
                       </Button>
                   </form>
                ) : (
                   <form onSubmit={handleResetPassword} className="space-y-5">
                       <div className="text-center space-y-3">
                           <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">Input Verification Token</label>
                           <div className="flex justify-center w-full">
                               <div className="dark-otp-wrapper"> 
                                    <OtpInput 
                                        length={6} 
                                        onComplete={(code) => setOtp(code)} 
                                    />
                               </div>
                           </div>
                       </div>

                       <div className="space-y-3 pt-2">
                           <Input
                               id="new-password"
                               label="New Security Key"
                               type="password"
                               value={newPassword}
                               onChange={(e) => setNewPassword(e.target.value)}
                               disabled={isResetting}
                               className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                           />
                           <Input
                               id="confirm-password"
                               label="Confirm Key"
                               type="password"
                               value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)}
                               disabled={isResetting}
                               className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                           />
                       </div>

                       <Button 
                            type="submit" 
                            disabled={isResetting} 
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-mono tracking-widest text-xs font-bold rounded flex items-center justify-center gap-2"
                        >
                           {isResetting ? <Loader spinnerClassName="w-4 h-4 text-black" /> : (
                               <>
                                   <span>OVERRIDE PROTOCOL</span>
                                   <ShieldAlert size={14} />
                               </>
                           )}
                       </Button>
                   </form>
                )}

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-3 pt-6 border-t border-white/5">
                    <p className="text-xs text-zinc-500">
                       Recall Credentials?{' '}
                       <button type="button" onClick={onSwitchToLogin} className="text-white hover:text-red-400 underline decoration-zinc-700 underline-offset-4 transition-colors">
                         Access Terminal
                       </button>
                    </p>
                    {step === 1 && (
                         <p className="text-xs text-zinc-600">
                            No Identity Found?{' '}
                            <button type="button" onClick={onSwitchToSignUp} className="text-zinc-400 hover:text-white transition-colors">
                                Initialize New User
                            </button>
                         </p>
                    )}
                </div>
            </div>
            
             {/* Decorative Tech Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 rounded-br-sm"></div>
        </div>

      </div>
    </div>
  );
};