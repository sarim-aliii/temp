import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';


interface WaitlistUser {
  _id: string;
  email: string;
  position: number;
  createdAt: string;
  notified: boolean;
  approved: boolean;
}

const AdminWaitlist = () => {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch if key is saved in localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('admin_key');
    if (savedKey) setKey(savedKey);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8080/api/waitlist/all', {
        headers: { 'x-admin-key': key }
      });
      setUsers(res.data.data);
      localStorage.setItem('admin_key', key); 
    } catch (err: any) {
      setError('ACCESS_DENIED: Invalid Key');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("WARNING: DESTROY ALL DATA?")) return;
    try {
      await axios.delete('http://localhost:8080/api/waitlist/reset', {
        headers: { 'x-admin-key': key }
      });
      setUsers([]);
      alert("SYSTEM RESET COMPLETE");
    } catch (err) {
      alert("Reset Failed");
    }
  }

  const handleApprove = async (id: string, email: string) => {
    if (!confirm(`Grant access to ${email}?`)) return;

    try {
      await axios.put(`http://localhost:8080/api/waitlist/approve/${id}`, {}, {
        headers: { 'x-admin-key': key }
      });
      // Refresh list to show updated status
      fetchUsers();
    } catch (err) {
      alert("Approval Failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono p-8 pt-20">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl text-white font-bold tracking-tighter flex items-center gap-2">
              <ShieldAlert className="text-nothing-red" />
              ADMIN_CONSOLE
            </h1>
            <p className="text-xs text-zinc-500 mt-1">WAITLIST DATABASE // RESTRICTED ACCESS</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Total Nodes</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-10 items-center bg-zinc-900/30 p-4 rounded-lg border border-white/5">
          <div className="flex-1 relative">
            <Lock size={16} className="absolute left-3 top-3 text-zinc-600" />
            <input
              type="password"
              placeholder="ENTER_ADMIN_KEY"
              value={key}
              className="bg-black border border-zinc-700 text-white pl-10 pr-4 py-2 w-full focus:border-nothing-red focus:outline-none rounded"
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="bg-white text-black px-6 py-2 font-bold hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2 rounded"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'FETCH_DATA'}
          </button>

          {users.length > 0 && (
            <button
              onClick={handleReset}
              className="bg-red-950/30 text-red-500 border border-red-900/50 px-4 py-2 hover:bg-red-900/50 flex items-center gap-2 rounded ml-auto"
            >
              <Trash2 size={16} /> WIPE DB
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 text-red-500 p-4 mb-6 font-mono text-sm text-center">
            {error}
          </div>
        )}

        {/* Data Table */}
        {users.length > 0 && (
          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-zinc-500 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-4 font-normal">Pos</th>
                  <th className="p-4 font-normal">Email / Terminal ID</th>
                  <th className="p-4 font-normal">Timestamp</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 text-white font-bold">#{user.position}</td>
                    <td className="p-4 text-zinc-300">{user.email}</td>
                    <td className="p-4 text-zinc-500 font-mono text-xs">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                    
                    {/* Status Column Logic */}
                    <td className="p-4">
                      {user.approved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-900/30 text-blue-400 border border-blue-900/50">
                          APPROVED
                        </span>
                      ) : user.notified ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-900/30 text-green-400 border border-green-900/50">
                          WAITING
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* Action Column Logic */}
                    <td className="p-4 text-right">
                      {!user.approved && (
                        <button
                          onClick={() => handleApprove(user._id, user.email)}
                          className="text-[10px] font-bold border border-white/20 hover:bg-white hover:text-black text-white px-3 py-1 transition-colors uppercase tracking-widest rounded"
                        >
                          GRANT_ACCESS
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWaitlist;