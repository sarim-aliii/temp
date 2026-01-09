import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/Button';
import OtpInput from '../ui/OtpInput';
import { Loader } from '../ui/Loader';
import { authApi } from '../../services/api'; 
import { ShieldCheck, Radio, RefreshCcw, Wifi, AlertTriangle } from 'lucide-react';


interface VerifyEmailPageProps {
  email?: string;
  onSuccess?: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ email: propEmail, onSuccess }) => {
  const [token, setToken] = useState('');
  const [timer, setTimer] = useState(60);
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || propEmail || localStorage.getItem('pendingVerificationEmail');

  const { 
    execute: verify, 
    loading: isLoading, 
    error: verifyError 
  } = useApi(authApi.verifyEmail);

  const { 
    execute: resend, 
    loading: isResending 
  } = useApi(authApi.resendVerification);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerification = async (code: string) => {
    setSuccessMsg('');
    if (!code || code.length < 6 || isLoading) return;
    
    if (!email) {
       alert("Identity lost. Redirecting to initialization.");
       window.location.href = '/#/signup'; 
       return;
    }

    try {
      const response = await verify({ email, token: code });
      
      if (response) {
        setSuccessMsg('IDENTITY_CONFIRMED. INITIALIZING UPLINK...');
        localStorage.removeItem('pendingVerificationEmail');

        if (response.data?.token) {
            localStorage.setItem('token', response.data.token);
        }

        if (onSuccess) {
            onSuccess();
        } else {
            setTimeout(() => {
                window.location.href = '/#/dashboard';
                window.location.reload(); 
            }, 800);
        }
      }
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setSuccessMsg('');
    try {
      await resend({ email });
      setSuccessMsg('SIGNAL_REFRESHED: CHECK_INBOX');
      setTimer(60); 
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerification(token);
  };

  if (!email) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white font-mono gap-4">
            <div className="text-red-500 animate-pulse">NO IDENTITY FOUND</div>
            <Button onClick={() => navigate('/signup')} variant="secondary" className="border-white/20 text-white">
                RETURN TO INITIALIZATION
            </Button>
        </div>
      );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden relative">

      {/* 1. Header */}
      <header className="flex-none w-full px-6 py-6 flex justify-between items-center z-20">
         <div className="flex items-center gap-2">
            <Wifi size={16} className={`text-red-500 ${isLoading ? 'animate-pulse' : ''}`} />
            <span className="font-mono text-xs tracking-[0.2em] text-zinc-500">WAITING_FOR_SIGNAL</span>
         </div>
         <div className="flex gap-2">
            <span className="font-mono text-[10px] hidden sm:block text-zinc-600">ENCRYPTION_LAYER_3</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        
        {/* Card Container */}
        <div className="w-full max-w-md">
            
            {/* Aesthetic Border */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                
                <div className="relative bg-zinc-900/90 border border-white/10 p-8 rounded-lg shadow-2xl">
                    
                    {/* Header Section */}
                    <div className="mb-6 flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2 relative">
                            <div className="absolute inset-0 bg-red-500/10 animate-ping rounded-full opacity-50"></div>
                            <Radio size={20} className="text-white relative z-10" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Verify Identity</h2>
                        <p className="text-xs text-zinc-500 font-mono tracking-wide break-all">
                            CODE SENT TO <span className="text-zinc-300 border-b border-white/10 pb-0.5">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center w-full py-2">
                            <OtpInput 
                                length={6} 
                                onComplete={(code) => {
                                    setToken(code);
                                    handleVerification(code);
                                }} 
                            />
                        </div>

                        {verifyError && (
                            <div className="p-3 bg-red-950/50 border border-red-500/30 rounded flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                <span className="text-xs text-red-200 font-mono uppercase tracking-wide">{verifyError}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-green-950/50 border border-green-500/30 rounded flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <ShieldCheck size={14} className="text-green-500 shrink-0" />
                                <span className="text-xs text-green-200 font-mono uppercase tracking-wide">{successMsg}</span>
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={isLoading || token.length < 6} 
                            className="w-full h-11 bg-white text-black hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99] transition-all font-mono tracking-widest text-xs font-bold rounded flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader spinnerClassName="w-4 h-4 text-black" /> : (
                                <>
                                    <span>AUTHENTICATE</span>
                                    <ShieldCheck size={14} />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-white/5 text-center">
                          {timer > 0 ? (
                           <div className="flex justify-center items-center gap-2 text-zinc-500 font-mono text-[10px]">
                               <RefreshCcw size={10} className="animate-spin duration-[3000ms]" />
                               <span>RETRY IN {timer}s</span>
                           </div>
                          ) : (
                           <button
                             onClick={handleResend}
                             disabled={isResending}
                             className="mx-auto group flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"
                           >
                             <RefreshCcw size={10} className={`group-hover:rotate-180 transition-transform duration-500 ${isResending ? 'animate-spin' : ''}`} />
                             <span>{isResending ? 'TRANSMITTING...' : 'RESEND SIGNAL'}</span>
                           </button>
                          )}
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Global Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMzMzIiAvPgo8L3N2Zz4=')] opacity-20"></div>
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-800/20 blur-[100px] rounded-full"></div>
      </div>

    </div>
  );
};