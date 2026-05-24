
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Play, Flame, Award, Clock } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const sessions = useAppStore(state => state.sessions);
  
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Welcome Back!</h1>
          <p className="text-zinc-400 text-lg">Ready to crush some curls today?</p>
        </div>
        <button 
          onClick={() => navigate('/workout')}
          className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
        >
          <Play className="w-6 h-6 fill-current" />
          <span className="text-lg">Start Workout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-24 h-24 text-amber-500" />
          </div>
          <span className="text-zinc-400 font-medium">Total Sessions</span>
          <span className="text-4xl font-black text-white">{sessions.length}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-24 h-24 text-amber-500" />
          </div>
          <span className="text-zinc-400 font-medium">Total Reps Logged</span>
          <span className="text-4xl font-black text-white">
            {sessions.reduce((acc, curr) => acc + curr.totalReps, 0)}
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24 text-amber-500" />
          </div>
          <span className="text-zinc-400 font-medium">Total Time Logged</span>
          <span className="text-4xl font-black text-white">
            {Math.floor(sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60)} min
          </span>
        </div>
      </div>

      {lastSession && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Last Session</h2>
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">
                  {new Date(lastSession.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{lastSession.totalReps}</span>
                  <span className="text-zinc-400 font-medium text-lg">reps completed</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-zinc-950 rounded-2xl px-6 py-4 border border-zinc-800">
                  <span className="block text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Duration</span>
                  <span className="text-xl font-bold text-white">
                    {Math.floor(lastSession.durationSeconds / 60)}m {lastSession.durationSeconds % 60}s
                  </span>
                </div>
                <div className="bg-zinc-950 rounded-2xl px-6 py-4 border border-zinc-800">
                  <span className="block text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Max Fatigue</span>
                  <span className="text-xl font-bold text-red-400">
                    {Math.round(Math.max(...lastSession.dataPoints.map(p => p.fatigue)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/session/${lastSession.id}`)}
              className="mt-8 w-full block text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 rounded-xl transition-colors"
            >
              View Full Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
