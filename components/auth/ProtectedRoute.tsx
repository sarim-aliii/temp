import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Loader } from '../ui/Loader'; 
import { ShieldCheck } from 'lucide-react';


const ProtectedRoute = () => {
  const { currentUser, loading } = useAppContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="relative flex h-screen w-full flex-col items-center justify-center bg-black overflow-hidden text-white">
        
        {/* 1. Global Noise Texture */}
        <div className="absolute inset-0 z-[1] opacity-[0.04] pointer-events-none mix-blend-overlay"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        {/* 2. Ambient Background */}
        <div className="absolute inset-0 z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] bg-red-900/10 blur-[100px] rounded-full animate-pulse" />
        </div>

        {/* 3. Aesthetic Loading UI */}
        <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                <Loader spinnerClassName="w-10 h-10 text-red-500 relative z-10" />
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs tracking-[0.2em] animate-pulse">
                    <ShieldCheck size={14} className="text-red-500" />
                    <span>VERIFYING_CREDENTIALS</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono">ENCRYPTED CONNECTION</span>
            </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;