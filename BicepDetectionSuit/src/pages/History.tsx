
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Play, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

export const History = () => {
  const sessions = useAppStore(state => state.sessions);
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-12 h-12 text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Sessions Yet</h2>
        <p className="text-zinc-500 mb-8">Start your first workout to see your progress history and AI form analysis.</p>
        <button 
          onClick={() => navigate('/workout')}
          className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          Start First Workout
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Workout History</h1>
        <p className="text-zinc-400 mt-1">Review your past sessions and form analysis</p>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => navigate(`/session/${session.id}`)}
            className="group bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-3xl p-6 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">
                  {new Date(session.date).toLocaleDateString(undefined, { month: 'short' })}
                </span>
                <span className="text-xl font-black text-white leading-none">
                  {new Date(session.date).getDate()}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric' })} 
                  {' • '}
                  {new Date(session.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-2xl font-black text-white">
                  {session.totalReps} <span className="text-zinc-500 text-lg font-medium">reps</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
              <div className="flex flex-col text-center md:text-right">
                <span className="text-zinc-500 uppercase text-xs font-bold tracking-wider mb-1">Duration</span>
                <span className="text-white font-mono font-bold">
                  {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                </span>
              </div>
              <div className="flex flex-col text-center md:text-right">
                <span className="text-zinc-500 uppercase text-xs font-bold tracking-wider mb-1">Peak Fatigue</span>
                <span className="text-white font-mono font-bold">
                  {Math.round(Math.max(...session.dataPoints.map(p => p.fatigue)) * 100)}%
                </span>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-amber-500 text-zinc-400 group-hover:text-amber-950 flex items-center justify-center transition-colors ml-2 hidden md:flex">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
