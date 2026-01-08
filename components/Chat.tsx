import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { Send, Sparkles, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { refineMessage } from '../services/geminiService';
import { getSocket } from '../services/socket';
import { useAppContext } from '../context/AppContext';


interface ChatProps {
    recipient: User;
    messages: Message[];
    onSendMessage: (text: string) => void;
    partnerSocketId: string | null;
}

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, 
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const Chat: React.FC<ChatProps> = ({ recipient, messages, onSendMessage, partnerSocketId }) => {
  const { currentUser } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // Video Call State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [partnerStream, setPartnerStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const socket = getSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket & Signaling Setup
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async (payload: { sender: string, data: any }) => {
        const { data, sender } = payload;
        
        if (!peerRef.current) {
             // Case 1: We receive an Offer (we are the receiver)
             if (data.type === 'offer') {
                 console.log("Received Offer from", sender);
                 
                 // Initialize Peer (camera, tracks, etc)
                 const peer = await initializePeer(sender); 
                 
                 if (peer) {
                     // 1. Process the Offer
                     await peer.setRemoteDescription(new RTCSessionDescription(data));
                     
                     // 2. Process any Queued Candidates that arrived while we were initializing
                     if (pendingCandidates.current.length > 0) {
                        console.log(`Processing ${pendingCandidates.current.length} queued candidates`);
                        for (const candidate of pendingCandidates.current) {
                            await peer.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                        pendingCandidates.current = []; // Clear queue
                     }

                     // 3. Send Answer
                     const answer = await peer.createAnswer();
                     await peer.setLocalDescription(answer);
                     socket.emit('p2pSignal', { target: sender, data: answer });
                 }
             } 
             // Case 2: We receive a Candidate BEFORE the Offer is processed
             else if (data.candidate) {
                 console.log("Queueing early candidate");
                 pendingCandidates.current.push(data.candidate);
             }
        } else {
            // Peer is already active
            if (data.type === 'answer') {
                 console.log("Received Answer");
                 await peerRef.current.setRemoteDescription(new RTCSessionDescription(data));
            } else if (data.candidate) {
                 console.log("Received Candidate");
                 await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }
    };

    socket.on('p2pSignal', handleSignal);

    return () => {
      socket.off('p2pSignal', handleSignal);
      endCall();
    };
  }, []);

  const initializePeer = async (targetId: string) => {
      try {
          const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setStream(currentStream);
          if (myVideo.current) myVideo.current.srcObject = currentStream;

          const peer = new RTCPeerConnection(RTC_CONFIG);
          peerRef.current = peer;

          currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

          peer.onicecandidate = (event) => {
              if (event.candidate && socket) {
                  socket.emit('p2pSignal', { target: targetId, data: { candidate: event.candidate } });
              }
          };

          peer.ontrack = (event) => {
              console.log("Received Remote Stream");
              setPartnerStream(event.streams[0]);
              if (partnerVideo.current) partnerVideo.current.srcObject = event.streams[0];
          };

          setIsCallActive(true);
          return peer;
      } catch (err) {
          console.error("Failed to access media devices:", err);
          alert("Could not access camera/microphone.");
          return null;
      }
  };

  const startCall = async () => {
      if (!partnerSocketId) {
          alert("Waiting for partner to join...");
          return;
      }
      
      const peer = await initializePeer(partnerSocketId);
      if (peer && socket) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('p2pSignal', { target: partnerSocketId, data: offer });
      }
  };

  const endCall = () => {
      if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
      }
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setPartnerStream(null);
      setIsCallActive(false);
      pendingCandidates.current = []; // Clear queue on end
  };

  const toggleVideo = () => {
      if (stream) {
          const videoTrack = stream.getVideoTracks()[0];
          videoTrack.enabled = !videoTrack.enabled;
          setIsVideoEnabled(videoTrack.enabled);
      }
  };

  const toggleAudio = () => {
      if (stream) {
          const audioTrack = stream.getAudioTracks()[0];
          audioTrack.enabled = !audioTrack.enabled;
          setIsAudioEnabled(audioTrack.enabled);
      }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleAiEnhance = async (tone: 'romantic' | 'cryptic') => {
    if (!inputText.trim()) return;
    setIsAiProcessing(true);
    try {
      const enhanced = await refineMessage(inputText, tone);
      setInputText(enhanced);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col pt-24 pb-4">
      {/* Video Area */}
      <div className={`transition-all duration-500 ease-in-out px-6 mb-4 ${isCallActive ? 'h-64 md:h-80' : 'h-0 overflow-hidden'}`}>
        <div className="w-full h-full grid grid-cols-2 gap-4">
             {/* My Video */}
             <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group">
                <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" />
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <button onClick={toggleAudio} className={`p-2 rounded-full ${isAudioEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500'} backdrop-blur-md transition-colors`}>
                        {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                    <button onClick={toggleVideo} className={`p-2 rounded-full ${isVideoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500'} backdrop-blur-md transition-colors`}>
                        {isVideoEnabled ? <VideoIcon size={16} /> : <VideoOff size={16} />}
                    </button>
                </div>
                <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-[10px] font-mono uppercase text-zinc-400">You</div>
             </div>

             {/* Partner Video */}
             <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                {partnerStream ? (
                    <video ref={partnerVideo} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                         <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 animate-spin-slow"></div>
                         <p className="font-mono text-xs text-zinc-500 uppercase">Connecting...</p>
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-[10px] font-mono uppercase text-zinc-400">Partner</div>
             </div>
        </div>
      </div>

      {/* Chat Header */}
      <div className="px-6 pb-4 border-b border-zinc-900 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="relative">
                <img src={recipient.avatar} alt="Recipient" className="w-12 h-12 rounded-full border border-zinc-800 grayscale" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${partnerSocketId ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
            </div>
            <div>
                <h2 className="text-lg font-bold tracking-tight">{recipient.name}</h2>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={10} className="text-nothing-red" />
                    <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
                        {partnerSocketId ? 'SIGNAL: STRONG' : 'SIGNAL: SEARCHING...'}
                    </p>
                </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
             {isCallActive ? (
                <button 
                    onClick={endCall}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all font-mono text-xs font-bold"
                >
                    <PhoneOff size={16} /> END LINK
                </button>
             ) : (
                <button 
                    onClick={startCall}
                    disabled={!partnerSocketId}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-full hover:bg-nothing-red hover:border-nothing-red transition-all font-mono text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <VideoIcon size={16} /> INITIATE LINK
                </button>
             )}
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
                <div className="w-16 h-16 border border-dashed border-white rounded-full flex items-center justify-center animate-spin-slow mb-4">
                    <Sparkles size={24} />
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.5em]">Initiating Handshake...</p>
            </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === (currentUser?._id || currentUser?.id);
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div 
                    className={`
                        relative px-5 py-3 rounded-2xl text-sm leading-relaxed
                        ${isMe 
                            ? 'bg-nothing-red text-white rounded-br-none' 
                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                        }
                    `}
                >
                    {msg.text}
                    <div className={`absolute top-0 ${isMe ? '-left-1' : '-right-1'} w-1 h-1 bg-current opacity-20`}></div>
                </div>
                <span className="text-[10px] font-mono text-zinc-600 mt-1 opacity-50 uppercase tracking-tighter">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-8 mt-auto">
         {inputText.length > 3 && (
            <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button 
                    onClick={() => handleAiEnhance('romantic')}
                    disabled={isAiProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono hover:border-nothing-red hover:text-nothing-red transition-colors disabled:opacity-50"
                >
                    <Sparkles size={10} />
                    ADJUST TONE: WARM
                </button>
                <button 
                     onClick={() => handleAiEnhance('cryptic')}
                     disabled={isAiProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono hover:border-white hover:text-white transition-colors disabled:opacity-50"
                >
                    <Sparkles size={10} />
                    ADJUST TONE: MINIMAL
                </button>
            </div>
         )}

         <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-black border border-zinc-800 rounded-2xl flex items-center p-2 focus-within:border-zinc-600 transition-colors">
                <button className="p-2 text-zinc-500 hover:text-white transition-colors"><ImageIcon size={20} /></button>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isAiProcessing ? "Refining signal..." : "Inject signal..."}
                    disabled={isAiProcessing}
                    className="flex-1 bg-transparent border-none outline-none text-white px-3 font-light placeholder:text-zinc-700"
                />
                <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Mic size={20} /></button>
                <button 
                    onClick={handleSend}
                    disabled={!inputText.trim() || isAiProcessing}
                    className="p-2 bg-zinc-900 rounded-xl text-white ml-2 hover:bg-nothing-red transition-colors disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </div>
         </div>
         <div className="text-center mt-2 pb-2">
            <span className="font-mono text-[9px] text-zinc-700 tracking-widest uppercase">Signal Encrypted via Blur_Sync</span>
         </div>
      </div>
    </div>
  );
};