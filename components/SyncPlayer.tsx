import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { getSocket } from '../services/socket';
import { Play, Pause, Link as LinkIcon, Volume2, VolumeX } from 'lucide-react';

interface SyncPlayerProps {
    isPaired: boolean;
}

export const SyncPlayer: React.FC<SyncPlayerProps> = ({ isPaired }) => {
    const socket = getSocket();
    const VideoPlayer = ReactPlayer as any;
    const playerRef = useRef<any>(null);
    
    // --- STATE ---
    const [url, setUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true); 
    const [volume, setVolume] = useState(0.8);
    
    // TIMERS
    const lastInteractionTime = useRef(0); 

    // --- SOCKET SYNC ---
    useEffect(() => {
        if (!socket || !isPaired) return;

        const handleServerState = (state: any) => {
            if (!state || !state.playbackState) return;
            const { videoSource, playbackState } = state;

            // 1. Sync URL
            if (videoSource?.src && videoSource.src !== url) {
                setUrl(videoSource.src);
            }

            // IGNORE SERVER: If we interacted recently (< 2s), ignore server updates
            const timeSinceInteraction = Date.now() - lastInteractionTime.current;
            if (timeSinceInteraction < 2000) return;

            // 2. Sync Play/Pause
            if (playbackState.isPlaying !== playing) {
                setPlaying(playbackState.isPlaying);
            }

            // 3. Sync Time (Safe Mode)
            if (playbackState.isPlaying && playerRef.current) {
                try {
                    // Check if function exists to prevent crash
                    if (typeof playerRef.current.getCurrentTime !== 'function' || 
                        typeof playerRef.current.seekTo !== 'function') return;

                    const currentTime = playerRef.current.getCurrentTime();
                    const serverTime = playbackState.currentTime;
                    const timeSinceUpdate = (Date.now() - playbackState.lastUpdateTimestamp) / 1000;
                    const adjustedServerTime = serverTime + timeSinceUpdate;

                    if (Math.abs(currentTime - adjustedServerTime) > 1.5) {
                        playerRef.current.seekTo(adjustedServerTime, 'seconds');
                    }
                } catch (err) {
                    // Ignore seek errors
                }
            }
        };

        socket.on('serverUpdateState', handleServerState);
        return () => { socket?.off('serverUpdateState'); };
    }, [socket, isPaired, url, playing]);

    // --- HANDLERS ---
    const handlePlay = () => {
        lastInteractionTime.current = Date.now();
        setPlaying(true); // User controls state directly
        
        if (isPaired) {
             const currentTime = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
             socket?.emit('clientAction', {
                type: 'UPDATE_PLAYBACK_STATE',
                payload: { isPlaying: true, currentTime }
            });
        }
    };

    const handlePause = () => {
        lastInteractionTime.current = Date.now();
        setPlaying(false); // User controls state directly
        
        if (isPaired) {
             const currentTime = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
             socket?.emit('clientAction', {
                type: 'UPDATE_PLAYBACK_STATE',
                payload: { isPlaying: false, currentTime }
            });
        }
    };

    const handleUrlChange = (e: React.FormEvent) => {
        e.preventDefault();
        const newUrl = prompt("Enter YouTube URL:");
        if (newUrl) {
            lastInteractionTime.current = Date.now();
            setUrl(newUrl);
            setPlaying(true);
            if (isPaired) {
                socket?.emit('clientAction', {
                    type: 'UPDATE_VIDEO_SOURCE',
                    payload: { type: 'youtube', src: newUrl }
                });
            }
        }
    };

    return (
        <div className="w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative group">
            <div className="relative w-full aspect-video bg-black">
                <VideoPlayer
                    ref={playerRef}
                    url={url}
                    width="100%"
                    height="100%"
                    playing={playing}
                    volume={volume}
                    muted={muted}              
                    controls={true}  
                    
                    // --- CRITICAL FIX: DETACH EVENT LISTENERS ---
                    // We REMOVED onPlay and onPause. 
                    // This breaks the "Feedback Loop" causing the AbortError.
                    onError={(e: any) => console.error("Player Error:", e)}
                    
                    style={{ pointerEvents: 'auto' }}
                />
            </div>

            {/* CONTROLS */}
            <div className="p-4 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-4">
                     <button onClick={() => playing ? handlePause() : handlePlay()} className="text-white hover:text-red-500">
                        {playing ? <Pause /> : <Play />}
                     </button>
                     
                     <button onClick={() => setMuted(!muted)} className="text-white hover:text-blue-400">
                        {muted ? <VolumeX /> : <Volume2 />}
                     </button>
                     <div className="text-xs font-mono text-zinc-500 truncate max-w-[200px]">{url}</div>
                </div>
                
                <button 
                    onClick={handleUrlChange}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono"
                >
                    <LinkIcon size={14} /> Change Video
                </button>
            </div>
        </div>
    );
};