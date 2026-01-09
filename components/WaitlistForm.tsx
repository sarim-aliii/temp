import React, { useState, useEffect } from 'react';
import { joinWaitlist, getWaitlistStats } from '../services/waitlistService';
import { ArrowRight, Loader2, CheckCircle2, Lock, Cpu } from 'lucide-react';


const WaitlistForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    getWaitlistStats().then(setTotalCount);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await joinWaitlist(email);
      setMessage(data.message || 'Success!');
      if (data.position) setPosition(data.position);
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS STATE (Ticket View) ---
  if (position) {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-8 w-full max-w-md relative overflow-hidden group">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-nothing-red/10 to-transparent opacity-20" />
        <div className="absolute top-0 left-0 w-full h-1 bg-nothing-red" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-nothing-red/20 flex items-center justify-center border border-nothing-red/50 text-nothing-red mb-2">
            <CheckCircle2 size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-white">ACCESS RESERVED</h3>
            <p className="text-zinc-400">You are on the frequency.</p>
          </div>

          <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-2 right-3 flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                 <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-2">Current Position</p>
            <p className="text-5xl font-mono font-bold text-white tracking-tighter">
              #{position.toString().padStart(4, '0')}
            </p>
          </div>

          <p className="text-xs text-zinc-500 font-mono pt-4 border-t border-white/5 w-full">
            NOTIFICATION_PENDING...
          </p>
        </div>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="bg-[#0a0a0a] border border-white/10 p-8 w-full max-w-md relative overflow-hidden">
      {/* Decorative Noise/Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")` }} 
      />

      <div className="relative z-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Join the Signal.</h2>
          <p className="text-zinc-400 text-sm">
            {totalCount > 0 
              ? <span className="font-mono text-xs"><span className="text-white font-bold">{totalCount}</span> NODES WAITING</span>
              : 'Be the first to connect.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-mono text-zinc-500 uppercase tracking-widest ml-1">
              Email
            </label>
            <div className="relative group">
              <input
                type="email"
                id="email"
                required
                className="w-full bg-zinc-900/50 border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-nothing-red/50 focus:ring-1 focus:ring-nothing-red/50 transition-all placeholder:text-zinc-700 font-mono text-sm"
                placeholder="user@blurchat.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute right-3 top-3 text-zinc-700 group-focus-within:text-nothing-red transition-colors">
                <Cpu size={18} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group relative bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-widest text-xs py-4 rounded-lg overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing_Req</span>
                </>
              ) : (
                <>
                  <span>Request Access</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
             {/* Hover effect red flash */}
            <div className="absolute inset-0 bg-nothing-red/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
          <Lock size={12} />
          <span>256-BIT ENCRYPTED WAITLIST</span>
        </div>

        {/* Error Message */}
        {message && (
          <div className={`mt-4 p-3 text-xs font-mono border-l-2 ${message.includes('Error') || message.includes('Failed') ? 'border-red-500 text-red-400 bg-red-950/20' : 'border-green-500 text-green-400 bg-green-950/20'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistForm;