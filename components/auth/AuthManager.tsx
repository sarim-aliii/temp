import React, { useState, useEffect } from 'react';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { VerifyEmailPage } from './VerifyEmailPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { ArrowLeft, ShieldAlert } from 'lucide-react';


type AuthView = 'login' | 'signup' | 'forgot-password' | 'verify-email' | 'reset-password';


const AuthLayout: React.FC<{ children: React.ReactNode; title?: string; onBack?: () => void }> = ({ children, title, onBack }) => (
  <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white selection:bg-red-500/30 selection:text-red-200 overflow-hidden">
    
    {/* Global Noise Texture */}
    <div className="fixed inset-0 z-[1] opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    </div>

    {/* Ambient Background */}
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-zinc-800/20 blur-[120px] rounded-full animate-pulse duration-[5s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-red-900/10 blur-[150px] rounded-full opacity-30" />
    </div>

    {/* Dot Matrix Overlay */}
    <div className="fixed inset-0 dot-matrix opacity-[0.03] z-0 pointer-events-none" />

    {/* Navbar / Back Button */}
    {onBack && (
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-zinc-500">
        <button onClick={onBack} className="flex items-center gap-2 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
            <span className="font-mono text-xs tracking-[0.2em]">BACK</span>
        </button>
      </nav>
    )}

    {/* Content Wrapper */}
    <div className="relative z-10 w-full max-w-md p-6">
        <div className="relative group">
            {/* Glow Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-700 via-zinc-800 to-red-900 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-2xl">
                {title && (
                   <div className="mb-8 flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                          <ShieldAlert size={18} className="text-red-500" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-white uppercase">{title}</h2>
                  </div>
                )}
                {children}
            </div>
        </div>
    </div>
  </div>
);

export const AuthManager: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
    const [userEmail, setUserEmail] = useState('');
    const [resetToken, setResetToken] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || params.get('resetToken');
        
        if (token) {
            setResetToken(token);
            setView('reset-password');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleSignUpSuccess = (email: string) => {
        setUserEmail(email);
        setView('verify-email');
    };

    const handleForgotPasswordSuccess = (email: string) => {
        setUserEmail(email);
    };

    const handlePasswordResetSuccess = () => {
        setView('login');
    };
    
    switch (view) {
        case 'login':
            return <LoginPage onSwitchToSignUp={() => setView('signup')} onSwitchToForgotPassword={() => setView('forgot-password')} />;
        
        case 'signup':
            return <SignUpPage onSwitchToLogin={() => setView('login')} onSignUpSuccess={handleSignUpSuccess} />;
        
        case 'forgot-password':
            return (
                <AuthLayout title="Recovery Protocol" onBack={() => setView('login')}>
                    <ForgotPasswordPage 
                        onSuccess={handleForgotPasswordSuccess} 
                        onSwitchToLogin={() => setView('login')}
                        onSwitchToSignUp={() => setView('signup')} 
                    />
                </AuthLayout>
            );
        
        case 'verify-email':
            return (
                <AuthLayout title="Verification Required">
                    <VerifyEmailPage email={userEmail} onSuccess={() => { }} />
                </AuthLayout>
            );
        
        case 'reset-password':
            return (
                <AuthLayout title="Reset Credentials">
                    <ResetPasswordPage token={resetToken} onSuccess={handlePasswordResetSuccess} onSwitchToLogin={() => setView('login')} />
                </AuthLayout>
            );
            
        default:
            return <LoginPage onSwitchToSignUp={() => setView('signup')} onSwitchToForgotPassword={() => setView('forgot-password')} />;
    }
};