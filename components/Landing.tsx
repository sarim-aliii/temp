import React, { useEffect, useState } from 'react';
import { Reveal } from './Reveal';
import { ArrowRight, Activity, Lock, Zap, Globe, Cpu, X } from 'lucide-react';
import WaitlistForm from './WaitlistForm'; 

interface LandingProps {
  onEnter: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  const [scrolled, setScrolled] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-black text-white selection:bg-nothing-red selection:text-white overflow-x-hidden">
      
      {/* --- WAITLIST MODAL --- */}
      {showWaitlist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
            onClick={() => setShowWaitlist(false)}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setShowWaitlist(false)}
              className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            {/* The Form */}
            <div className="overflow-hidden rounded-2xl shadow-2xl shadow-nothing-red/20">
              <WaitlistForm />
            </div>
          </div>
        </div>
      )}

      {/* 1. Global Noise Texture for "Raw" feel */}
      <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* 2. Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-nothing-red/20 blur-[120px] rounded-full animate-pulse duration-[4s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-900/20 blur-[150px] rounded-full opacity-50" />
      </div>

      {/* Dot Matrix Overlay */}
      <div className="fixed inset-0 dot-matrix opacity-[0.05] z-0 pointer-events-none" />

      {/* Navbar Placeholder */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-500">SYS.VER.2.0</span>
        <div className="flex gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${scrolled > 50 ? 'bg-nothing-red animate-pulse' : 'bg-zinc-800'}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${scrolled > 50 ? 'bg-nothing-red animate-pulse delay-75' : 'bg-zinc-800'}`} />
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center text-center px-4 pb-20">
        <Reveal>
          <div className="relative">
            <h1 className="text-[15vw] md:text-[12rem] font-bold tracking-tighter leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-700 select-none">
              BLUR<span className="text-nothing-red">.</span>
            </h1>
            {/* Decorative data lines */}
            <div className="absolute -right-4 top-4 hidden md:flex flex-col items-end gap-1 font-mono text-[10px] text-zinc-600">
               <span>45.42.12</span>
               <span>NET_active</span>
            </div>
          </div>
        </Reveal>
        
        <Reveal delay={0.2}>
          <p className="mt-8 text-lg md:text-2xl text-zinc-400 font-light max-w-xl mx-auto leading-relaxed tracking-wide">
            Unfilter your world. <br/> Connection in its <span className="text-white font-medium">rawest form</span>.
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="mt-16 flex flex-col items-center gap-6">
            
             {/* Main Login Button */}
             <button 
              onClick={onEnter}
              className="group relative px-10 py-5 bg-white text-black rounded-full font-mono text-sm font-bold tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              <div className="relative z-10 flex items-center gap-3">
                <span>ENTER SYSTEM</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
              <div className="absolute inset-0 bg-nothing-red transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out z-0" />
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>INITIALIZING</span>
                <Activity size={16} className="animate-bounce" />
              </div>
            </button>

            {/* --- NEW WAITLIST TRIGGER BUTTON --- */}
            <button 
              onClick={() => setShowWaitlist(true)}
              className="text-zinc-500 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors border-b border-transparent hover:border-nothing-red pb-1"
            >
              Request Access // Join Waitlist
            </button>
            
            <div className="flex items-center gap-4 opacity-50 mt-4">
                <span className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                    <Lock size={10} /> Encrypted
                </span>
                <span className="w-px h-3 bg-zinc-800"></span>
                <span className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                    <Zap size={10} /> Realtime
                </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FEATURE 1: Intimacy */}
      <section className="relative z-10 w-full max-w-7xl mx-auto py-32 px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
                <div className="group relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
                    <img 
                        src="https://picsum.photos/seed/blur/1000/1000?grayscale" 
                        alt="Intimacy" 
                        className="object-cover w-full h-full transition-all duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-40" 
                    />
                    
                    {/* UI Overlay on Image */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                             <div className="px-3 py-1 border border-nothing-red/50 bg-nothing-red/10 text-nothing-red font-mono text-xs backdrop-blur-md">
                                MODE: PRIVATE
                             </div>
                             <Activity className="text-white/50 w-5 h-5" />
                        </div>
                        <div>
                             <h3 className="text-4xl font-bold text-white mb-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">Only for two.</h3>
                             <p className="text-zinc-400 text-sm translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                                End-to-end encrypted signals.
                             </p>
                        </div>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={0.2}>
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                            Closer than <br/> <span className="text-zinc-600">close.</span>
                        </h2>
                        <div className="h-1 w-20 bg-nothing-red rounded-full"></div>
                    </div>
                    <p className="text-xl text-zinc-400 leading-relaxed max-w-md">
                        A dedicated frequency for your partner. Share moments, thoughts, and feelings in a channel encrypted by emotion.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4 font-mono text-sm text-zinc-500 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between group cursor-default">
                            <span className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-nothing-red rounded-full group-hover:scale-150 transition-transform"></span>
                                Real-time presence
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">01</span>
                        </div>
                        <div className="flex items-center justify-between group cursor-default">
                            <span className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-white transition-colors"></span>
                                AI-assisted expression
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">02</span>
                        </div>
                        <div className="flex items-center justify-between group cursor-default">
                            <span className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-white transition-colors"></span>
                                Ephemeral sharing
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">03</span>
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
      </section>

       {/* FEATURE 2: Signal (Inverted) */}
       <section className="relative z-10 w-full max-w-7xl mx-auto py-32 px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 space-y-8">
                <Reveal>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight">
                        Raw Data.<br/> <span className="text-nothing-red">Pure Signal.</span>
                    </h2>
                </Reveal>
                <Reveal delay={0.1}>
                    <p className="text-xl text-zinc-400 leading-relaxed mt-6 border-l-2 border-zinc-800 pl-6">
                        No algorithm. No clutter. Just the raw feed of your circle. Designed with the precision of hardware, delivered with the fluidity of software.
                    </p>
                </Reveal>
                <Reveal delay={0.2}>
                    <div className="flex gap-4 pt-4">
                        <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col gap-1 items-start w-32">
                            <Cpu size={20} className="text-nothing-red mb-1" />
                            <span className="text-xs text-zinc-500 font-mono">LATENCY</span>
                            <span className="text-lg font-bold">~12ms</span>
                        </div>
                        <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col gap-1 items-start w-32">
                            <Globe size={20} className="text-nothing-red mb-1" />
                            <span className="text-xs text-zinc-500 font-mono">NETWORK</span>
                            <span className="text-lg font-bold">P2P</span>
                        </div>
                    </div>
                </Reveal>
            </div>
            
            <Reveal delay={0.2} className="order-1 md:order-2">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-nothing-red to-blue-900 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="aspect-video rounded-3xl overflow-hidden relative border border-white/10 bg-[#050505] flex items-center justify-center">
                        <div className="absolute inset-0 dot-matrix opacity-20"></div>
                        
                        {/* Interactive Widget Simulation */}
                        <div className="w-full max-w-[300px] border border-zinc-800 bg-black/50 backdrop-blur-md rounded-lg p-4 space-y-3 transform transition-transform duration-500 group-hover:-translate-y-2">
                            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="font-mono text-xs text-zinc-400">LIVE FEED</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                                <div className="h-2 bg-zinc-800 rounded w-1/2 animate-pulse delay-75"></div>
                                <div className="h-2 bg-zinc-800 rounded w-5/6 animate-pulse delay-150"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-6 font-mono text-[10px] text-zinc-600">
                            RENDER_ENGINE_V1
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-12 border-t border-white/10 relative z-10 mt-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white rounded-full"></span>
                <span className="font-bold tracking-tight text-lg">BLUR.</span>
            </div>
            <span className="font-mono text-xs text-zinc-600 tracking-widest uppercase">
              Est. 2026 • Blur Labs • All Systems Nominal
            </span>
        </div>
      </footer>

    </div>
  );
};