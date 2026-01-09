import React, { useState, useEffect } from 'react';
import { Reveal } from './Reveal';
import { SyncPlayer } from './SyncPlayer';
import { useAppContext } from '../context/AppContext';
import { Heart, MessageSquare, Share2, MoreHorizontal, Send, CornerDownRight, Ghost } from 'lucide-react';
import { postsApi } from '../services/api';
import { getSocket } from '../services/socket';
import { formatDistanceToNow } from 'date-fns'; 


interface User {
    _id: string;
    name: string;
    avatar: string;
}

interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  author: User;
  content: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  type: string;
  createdAt: string;
}

const PostCard: React.FC<{ post: Post; onUserClick: (id: string) => void; currentUserId?: string }> = ({ post, onUserClick, currentUserId }) => {
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const isLiked = currentUserId ? likes.includes(currentUserId) : false;

  // Update local state when props change (from socket updates)
  useEffect(() => {
      setLikes(post.likes);
      setComments(post.comments);
  }, [post.likes, post.comments]);

  const handleLike = async () => {
    // Optimistic UI update
    const previousLikes = [...likes];
    if (isLiked && currentUserId) {
        setLikes(prev => prev.filter(id => id !== currentUserId));
    } else if (currentUserId) {
        setLikes(prev => [...prev, currentUserId]);
    }

    try {
        await postsApi.like(post._id);
    } catch (error) {
        setLikes(previousLikes);
        console.error("Failed to like post", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
        await postsApi.comment(post._id, newComment);
        setNewComment('');
    } catch (error) {
        console.error("Failed to post comment", error);
    }
  };

  const handleShare = () => {
    setIsSharing(true);
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    setTimeout(() => setIsSharing(false), 2000);
  };

  const timeAgo = (dateStr: string) => {
      try {
          return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
      } catch (e) {
          return 'Just now';
      }
  };

  return (
    <div className="group relative bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-all duration-500 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onUserClick(post.author._id)}
            className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-zinc-700 hover:ring-nothing-red transition-all group/avatar"
          >
            <img src={post.author.avatar || 'https://picsum.photos/200'} alt="avatar" className="w-full h-full object-cover grayscale group-hover/avatar:grayscale-0 transition-all duration-500" />
          </button>
          <div>
            <button 
                onClick={() => onUserClick(post.author._id)}
                className="text-sm font-bold leading-none tracking-tight hover:text-nothing-red transition-colors block text-left"
            >
                {post.author.name || 'Anonymous'}
            </button>
            <p className="font-mono text-[10px] text-zinc-500 leading-none mt-1 uppercase">{timeAgo(post.createdAt)} • {post.type}</p>
          </div>
        </div>
      </div>

      <div className="p-0 relative">
        {post.image && (
          <div className="w-full aspect-video overflow-hidden relative">
            <img src={post.image} alt="Post" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
              <p className="font-mono text-xs text-white/90 leading-relaxed max-w-[80%] border-l-2 border-nothing-red pl-3">{post.content}</p>
            </div>
          </div>
        )}
        {!post.image && (
          <div className="p-10 min-h-[220px] flex flex-col items-center justify-center text-center bg-dot-pattern relative">
            <p className="text-xl md:text-2xl font-light leading-relaxed tracking-tight italic">"{post.content}"</p>
          </div>
        )}
         {isSharing && (
          <div className="absolute inset-0 z-20 bg-nothing-red/90 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="text-center font-mono">
              <p className="text-white font-bold tracking-[0.3em] text-sm mb-2">SIGNAL ENCRYPTED</p>
              <p className="text-white/70 text-[10px]">LINK COPIED TO BUFFER</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-950/50">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all duration-300 hover:scale-110 ${isLiked ? 'text-nothing-red scale-110' : 'text-zinc-500 hover:text-white'}`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="font-mono text-xs font-bold">{likes.length}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 transition-colors ${showComments ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <MessageSquare size={20} />
            <span className="font-mono text-xs font-bold">{comments.length > 0 ? comments.length : 'REPLY'}</span>
          </button>
        </div>
        <button onClick={handleShare} className="text-zinc-500 hover:text-white transition-all hover:-rotate-12"><Share2 size={20} /></button>
      </div>

      {showComments && (
        <div className="border-t border-zinc-800 bg-black/40 animate-in slide-in-from-top duration-500 overflow-hidden">
          <div className="p-4 space-y-4 max-h-60 overflow-y-auto scrollbar-hide">
            {comments.length === 0 && (
              <p className="text-center font-mono text-[10px] text-zinc-600 py-4 italic uppercase tracking-widest">No signals received yet...</p>
            )}
            {comments.map((comment, idx) => (
              <div key={comment._id || idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="mt-1"><CornerDownRight size={12} className="text-nothing-red" /></div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase text-zinc-400">{comment.user?.name || 'Unknown'}</span>
                    <span className="font-mono text-[8px] text-zinc-600">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="p-4 border-t border-zinc-800/50 flex gap-2">
            <input 
              type="text" 
              placeholder="Inject response..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
            />
            <button type="submit" className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-nothing-red text-white"><Send size={16} /></button>
          </form>
        </div>
      )}
    </div>
  );
};

interface FeedProps {
    onUserClick: (userId: string) => void;
}

// --- Main Feed Component ---
export const Feed: React.FC<FeedProps> = ({ onUserClick }) => {
  const { currentUser } = useAppContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const isPaired = !!currentUser?.pairedWithUserId;

  // 1. Fetch initial posts
  useEffect(() => {
    const fetchPosts = async () => {
        try {
            const data = await postsApi.getAll();
            setPosts(data);
        } catch (e) {
            console.error("Failed to load feed", e);
        }
    };
    fetchPosts();
  }, []);

  // 2. Setup Real-time Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Handle new post
    const handleNewPost = (newPost: Post) => {
        setPosts(prev => [newPost, ...prev]);
    };

    // Handle updates (likes)
    const handlePostUpdate = (data: { postId: string, likes: string[] }) => {
        setPosts(prev => prev.map(p => 
            p._id === data.postId ? { ...p, likes: data.likes } : p
        ));
    };

    // Handle comments
    const handlePostComment = (data: { postId: string, comments: Comment[] }) => {
        setPosts(prev => prev.map(p => 
            p._id === data.postId ? { ...p, comments: data.comments } : p
        ));
    };

    socket.on('post:new', handleNewPost);
    socket.on('post:update', handlePostUpdate);
    socket.on('post:comment', handlePostComment);

    return () => {
        socket.off('post:new', handleNewPost);
        socket.off('post:update', handlePostUpdate);
        socket.off('post:comment', handlePostComment);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4 md:px-8">
      <div className="fixed inset-0 dot-matrix opacity-[0.03] pointer-events-none"></div>
      <div className="max-w-2xl mx-auto mb-16 relative">
        <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">Signal Feed</h1>
            <div className="flex items-center gap-2 mt-2">
               <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPaired ? 'bg-green-500' : 'bg-red-500'}`}></span>
               <p className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
                  Status: {isPaired ? 'Live Syncing' : 'Standalone Mode'}
               </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto mb-20 relative z-20">
         <Reveal delay={0.1}>
            <SyncPlayer isPaired={isPaired} />
         </Reveal>
      </div>

      <div className="max-w-2xl mx-auto space-y-16 relative z-10">
        {posts.length === 0 && (
             <div className="text-center py-20">
                 <p className="font-mono text-zinc-600">WAITING FOR SIGNALS...</p>
             </div>
        )}
        {posts.map((post, index) => (
          <Reveal key={post._id} delay={index * 0.1}>
            <PostCard 
                post={post} 
                onUserClick={onUserClick} 
                currentUserId={currentUser?._id || currentUser?.id} 
            />
          </Reveal>
        ))}
      </div>
       
      <div className="max-w-2xl mx-auto mt-32 text-center border-t border-zinc-900 pt-12">
        <p className="font-mono text-[10px] text-zinc-700 tracking-[0.5em] uppercase">-- End of Transmission --</p>
      </div>
    </div>
  );
};