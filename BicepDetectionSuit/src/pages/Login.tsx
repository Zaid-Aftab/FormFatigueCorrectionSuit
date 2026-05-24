import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Activity, Dumbbell } from 'lucide-react';

export const Login = () => {
  const setUser = useAppStore(state => state.setUser);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setUser(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <Dumbbell className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">RepSense</h1>
          <p className="text-zinc-400 text-center mb-8">Real-time AI form detection for your perfect bicep curl</p>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Trainer Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold px-4 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-4 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <Activity className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
