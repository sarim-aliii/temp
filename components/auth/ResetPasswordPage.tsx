import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { LockKeyhole, ShieldCheck, AlertCircle, ArrowLeft, Terminal, Mail, KeyRound } from 'lucide-react';


interface ResetPasswordPageProps {
  token: string;
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token, onSuccess, onSwitchToLogin }) => {
  const { resetPassword } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (token) setOtp(token);
  }, [token]);

  const { 
    execute: executeReset, 
    loading: isLoading, 
    error: apiError 
  } = useApi(resetPassword, "Credentials updated successfully.");

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) newErrors.email = 'Email address required.';
    if (!otp) newErrors.otp = 'Verification code required.';
    
    if (!newPassword) {
      newErrors.newPassword = 'New key required.';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
      newErrors.newPassword = 'Security weak: Req 8+ chars, Upper, Lower, Num, Special.';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Verification required.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Key mismatch.';
    }
    
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    if (!validate()) return;

    try {
      await executeReset({ 
        email: email.trim(), 
        otp: otp.trim(), 
        password: newPassword 
      });
      onSuccess();
    } catch (error) {
      // Hook handles the toast/error state
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white selection:bg-red-500/30 selection:text-red-200 overflow-hidden">

      {/* Global Noise Texture */}
      <div className="fixed inset-0 z-[1] opacity-[0.04] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-zinc-800/20 blur-[120px] rounded-full animate-pulse duration-[8s]" />
      </div>

      {/* Tech Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-zinc-500">
         <button onClick={onSwitchToLogin} className="flex items-center gap-2 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="font-mono text-xs tracking-[0.2em]">ABORT</span>
        </button>
        <div className="flex gap-2">
            <span className="font-mono text-[10px] hidden sm:block">SECURE_CHANNEL_ESTABLISHED</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-md p-6">
        
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700 via-red-900 to-zinc-700 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-2xl">
                
                <div className="mb-8 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                        <LockKeyhole size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">UPDATE CREDENTIALS</h2>
                    <p className="text-sm text-zinc-500 font-mono tracking-wide">ENTER CODE & NEW KEY</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <Input
                                id="email"
                                label="Email Address"
                                placeholder="Confirmed Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={validationErrors.email}
                                disabled={isLoading}
                                className="pl-10 bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                            />
                        </div>

                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <Input
                                id="otp"
                                label="Verification Code"
                                placeholder="Verification Code (OTP)"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                error={validationErrors.otp}
                                disabled={isLoading}
                                className="pl-10 bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                            />
                        </div>

                        <Input
                            id="new-password"
                            label="New Passcode"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            error={validationErrors.newPassword}
                            disabled={isLoading}
                            className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                        <Input
                            id="confirm-new-password"
                            label="Confirm Passcode"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={validationErrors.confirmPassword}
                            disabled={isLoading}
                            className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                    </div>
                    
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
                        className="w-full h-12 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-mono tracking-widest text-xs font-bold rounded flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <Loader spinnerClassName="w-4 h-4 text-black" /> : (
                            <>
                                <span>OVERRIDE</span>
                                <ShieldCheck size={14} />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <button type="button" onClick={onSwitchToLogin} className="flex items-center justify-center gap-2 mx-auto text-xs text-zinc-500 hover:text-white transition-colors group">
                         <Terminal size={12} />
                         <span className="group-hover:underline underline-offset-4">Return to Terminal</span>
                    </button>
                </div>
            </div>
            
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 rounded-br-sm"></div>
        </div>

      </div>
    </div>
  );
};