import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, RefreshCw, Shield, Crown, DollarSign } from 'lucide-react';


interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isPremium: boolean;
  createdAt: string;
  provider?: string;
}

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  revenue: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, premiumUsers: 0, revenue: 0 });
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium'>('all');

  // Auto-fetch if key is saved
  useEffect(() => {
    const savedKey = localStorage.getItem('admin_key');
    if (savedKey) {
        setKey(savedKey);
        fetchData(savedKey);
    }
  }, []);

  const fetchData = async (adminKey: string) => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'x-admin-key': adminKey };
      
      const [usersRes, statsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/admin/users', { headers }),
        axios.get('http://localhost:8080/api/admin/stats', { headers })
      ]);

      setUsers(usersRes.data.data);
      setStats(statsRes.data);
      localStorage.setItem('admin_key', adminKey);
    } catch (err: any) {
      console.error(err);
      setError('ACCESS_DENIED: Invalid Key or Server Error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => fetchData(key);

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(u => u.isPremium);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono p-4 md:p-8 pt-20">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl text-white font-bold tracking-tighter flex items-center gap-2">
              <Shield className="text-zinc-500" />
              OVERWATCH_CONSOLE
            </h1>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Live User Database // Restricted</p>
          </div>
          
          {/* Stats Cards */}
          {users.length > 0 && (
              <div className="flex gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg min-w-[100px]">
                      <p className="text-[10px] text-zinc-500 uppercase">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-zinc-900 border border-yellow-900/30 p-3 rounded-lg min-w-[100px]">
                      <p className="text-[10px] text-yellow-600 uppercase flex items-center gap-1"><Crown size={10} /> Premium</p>
                      <p className="text-2xl font-bold text-yellow-500">{stats.premiumUsers}</p>
                  </div>
                  <div className="bg-zinc-900 border border-green-900/30 p-3 rounded-lg min-w-[100px]">
                      <p className="text-[10px] text-green-600 uppercase flex items-center gap-1"><DollarSign size={10} /> Est. Rev</p>
                      <p className="text-2xl font-bold text-green-500">${stats.revenue.toFixed(2)}</p>
                  </div>
              </div>
          )}
        </div>

        {/* Login / Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center bg-zinc-900/30 p-4 rounded-xl border border-white/5">
          <div className="flex-1 relative w-full">
            <Lock size={16} className="absolute left-3 top-3 text-zinc-600" />
            <input
              type="password"
              placeholder="ENTER_ADMIN_KEY"
              value={key}
              className="bg-black border border-zinc-700 text-white pl-10 pr-4 py-2 w-full focus:border-nothing-red focus:outline-none rounded-lg"
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-white text-black px-6 py-2 font-bold hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2 rounded-lg w-full md:w-auto justify-center"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'AUTHENTICATE'}
          </button>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 text-red-500 p-4 mb-6 font-mono text-sm text-center rounded-lg animate-pulse">
            {error}
          </div>
        )}

        {/* Data View */}
        {users.length > 0 && (
          <>
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${filter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                >
                    ALL USERS
                </button>
                <button 
                    onClick={() => setFilter('premium')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${filter === 'premium' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                >
                    PREMIUM ONLY
                </button>
            </div>

            <div className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-900/20 backdrop-blur-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-zinc-500 uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-4 font-normal">User Identity</th>
                    <th className="p-4 font-normal">Status</th>
                    <th className="p-4 font-normal">Joined</th>
                    <th className="p-4 font-normal text-right">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-zinc-900/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-zinc-700">
                                <img src={user.avatar} alt="av" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-xs">{user.name}</p>
                                <p className="text-zinc-500 text-[10px] font-mono">{user.email}</p>
                            </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {user.isPremium ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                            <Crown size={12} fill="currentColor" /> PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                            FREE TIER
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-500 font-mono text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                        <span className="text-zinc-700 ml-2">{new Date(user.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 text-right">
                         <span className="text-[10px] uppercase text-zinc-600 border border-zinc-800 px-2 py-1 rounded bg-black">
                            {user.provider || 'EMAIL'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;