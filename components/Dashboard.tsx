import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Navbar } from './Navbar';
import { Feed } from './Feed';
import { Chat } from './Chat';
import { PairingView } from './PairingView';
import { ViewState, Message } from '../types';
import { connectSocket, getSocket } from '../services/socket';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAppContext();
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerSocketId, setPartnerSocketId] = useState<string | null>(null);

  // Initialize Socket when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentUser?.pairedWithUserId) {
      const socket = connectSocket(token);

      // 1. Handle Room Joined (LOAD HISTORY)
      socket.on('room-joined', (data: any) => {
        if (data.partnerSocketId) {
          console.log("Partner found:", data.partnerSocketId);
          setPartnerSocketId(data.partnerSocketId);
        }
        
        if (data.initialState && data.initialState.messages) {
           const history = data.initialState.messages.map((msg: any) => ({
              id: msg.id || Math.random().toString(),
              text: msg.text || msg.content,
              senderId: msg.senderId,
              timestamp: new Date(msg.timestamp)
           }));
           setMessages(history);
        }
      });

      // 2. Handle Partner Status
      socket.on('partner-online', (id: string) => {
        console.log("Partner came online:", id);
        setPartnerSocketId(id);
      });

      socket.on('partner-offline', () => {
        console.log("Partner left");
        setPartnerSocketId(null);
      });

      // 3. Handle Live Messages
      const handleNewMessage = (msg: any) => {
        const incomingMsg: Message = {
          id: msg.id || Math.random().toString(),
          senderId: msg.senderId || 'partner', 
          text: msg.text || msg.content,
          timestamp: new Date(msg.timestamp || Date.now())
        };
        setMessages(prev => [...prev, incomingMsg]);
      };

      socket.on('newChatMessage', handleNewMessage);

      // Cleanup
      return () => {
        socket.off('room-joined');
        socket.off('partner-online');
        socket.off('partner-offline');
        socket.off('newChatMessage', handleNewMessage);
      };
    }
  }, [currentUser?.pairedWithUserId]);

  const handleSendMessage = (text: string) => {
    const socket = getSocket();
    if (socket && currentUser) {
      socket.emit('clientAction', {
        type: 'SEND_MESSAGE',
        payload: {
          id: Date.now().toString(), // Generate ID here
          text,
          senderId: currentUser._id || currentUser.id,
          timestamp: Date.now()
        }
      });
    }
  };
  
  const onPairedSuccess = () => {
     window.location.reload();
  };

  if (!currentUser?.pairedWithUserId) {
      return (
        <div className="relative min-h-screen w-full bg-black text-white selection:bg-red-500/30 selection:text-red-200 overflow-hidden">
             <div className="fixed inset-0 z-[1] opacity-[0.04] pointer-events-none mix-blend-overlay" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
             </div>
             {currentUser ? <PairingView user={currentUser} onPaired={onPairedSuccess} /> : null}
        </div>
      );
  }

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-red-500/30 selection:text-red-200 overflow-x-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar currentView={view} setView={setView} />
          
          <main className="flex-1 w-full max-w-7xl mx-auto">
            {view === ViewState.FEED && <Feed onUserClick={() => setView(ViewState.CHAT)} />}
            
            {view === ViewState.CHAT && (
              <Chat 
                recipient={{ 
                   id: currentUser.pairedWithUserId, 
                   name: 'Partner', 
                   handle: '@connected', 
                   avatar: 'https://picsum.photos/200',
                   email: 'partner@example.com' 
                }} 
                messages={messages} 
                onSendMessage={handleSendMessage}
                partnerSocketId={partnerSocketId}
              />
            )}
          </main>
      </div>
    </div>
  );
};