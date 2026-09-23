import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, CheckCircle2, Search, Layers, RefreshCw } from 'lucide-react';

interface NotesItem {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export default function App() {
  const [items, setItems] = useState<NotesItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/notess');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/notess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        setName('');
        setDescription('');
        loadItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/notess/${id}`, { method: 'DELETE' });
      loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0B0D0E] text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-[#242A2E] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/20 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Notes Management Platform</h1>
              <p className="text-xs text-gray-500">Autonomous full-stack application for Build a notes app.</p>
            </div>
          </div>
          <button onClick={loadItems} className="p-2 rounded-lg bg-[#15191C] border border-[#242A2E] text-gray-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-[#15191C] border border-[#242A2E] space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#76B900]" /> Create Notes
            </h2>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full p-2.5 rounded-xl bg-[#0B0D0E] border border-[#242A2E] text-xs text-white outline-none focus:border-[#76B900]"
                required 
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3}
                className="w-full p-2.5 rounded-xl bg-[#0B0D0E] border border-[#242A2E] text-xs text-white outline-none focus:border-[#76B900] resize-none" 
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-[#76B900] text-black font-bold text-xs">
              Save Notes
            </button>
          </form>

          <div className="md:col-span-2 p-5 rounded-2xl bg-[#15191C] border border-[#242A2E] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Notes Records ({filtered.length})</h2>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Filter records..." 
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0B0D0E] border border-[#242A2E] text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-600 font-mono">No records yet.</div>
              ) : (
                filtered.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-[#0B0D0E] border border-[#242A2E] flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">{item.name}</h3>
                      <p className="text-[11px] text-gray-400">{item.description || 'No description provided.'}</p>
                      <span className="text-[10px] text-gray-600 font-mono">{item.created_at}</span>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
