import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { FormFault } from '../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { ArrowLeft, Target, Activity, Flame } from 'lucide-react';


const formLabels: Record<FormFault, string> = {
  good_form: 'Good Form',
  elbow_flaring: 'Elbow Flaring',
  incomplete_range: 'Incomplete Range',
  momentum_swinging: 'Momentum',
  wrist_bending: 'Wrist Bending'
};

const formColors: Record<FormFault, string> = {
  good_form: '#22c55e',       // green
  elbow_flaring: '#f59e0b',   // amber
  incomplete_range: '#ef4444',// red
  momentum_swinging: '#8b5cf6',// purple
  wrist_bending: '#ec4899'    // pink
};

export const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useAppStore(state => state.sessions.find(s => s.id === id));

  const { formBreakdown, fatigueData } = useMemo(() => {
    if (!session) return { formBreakdown: [], fatigueData: [] };

    // Group faults
    const counts = session.dataPoints.reduce((acc, dp) => {
      acc[dp.form] = (acc[dp.form] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const breakdown = Object.entries(counts)
      .map(([fault, count]) => ({
        name: formLabels[fault as FormFault],
        value: count,
        fill: formColors[fault as FormFault],
        percentage: Math.round((count / session.dataPoints.length) * 100)
      }))
      .sort((a, b) => b.value - a.value);

    // Format line chart data
    const fatigue = session.dataPoints.map(dp => ({
      time: dp.time,
      timeStr: `${Math.floor(dp.time / 60)}:${(dp.time % 60).toString().padStart(2, '0')}`,
      fatigue: Math.round(dp.fatigue * 100)
    }));

    return { formBreakdown: breakdown, fatigueData: fatigue };
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-bold text-white mb-4">Session Not Found</h2>
        <button onClick={() => navigate('/history')} className="text-amber-500">Back to History</button>
      </div>
    );
  }

  const goodFormPercentage = formBreakdown.find(f => f.name === 'Good Form')?.percentage || 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Session Summary</h1>
          <p className="text-zinc-400 text-sm md:text-base mt-1">
            {new Date(session.date).toLocaleString(undefined, { 
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-amber-500 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1">Total Reps</p>
            <p className="text-3xl font-black text-white leading-none">{session.totalReps}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-amber-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1">Duration</p>
            <p className="text-3xl font-black text-white leading-none font-mono">
              {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center" style={{ color: formColors.good_form }}>
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1">Form Accuracy</p>
            <p className="text-3xl font-black text-white leading-none">
              {goodFormPercentage}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Breakdown Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col h-[450px]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Form Analysis Breakdown
          </h2>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formBreakdown} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, _name: any, props: any) => [`${props.payload.percentage}% (${value} logs)`, 'Frequency']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 pl-4">
            <p className="text-sm text-zinc-400">
              <strong className="text-zinc-200">Insight:</strong> You maintained perfect form for <span className="text-green-400 font-bold">{goodFormPercentage}%</span> of the session.
            </p>
          </div>
        </div>

        {/* Fatigue Line Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col h-[450px]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Muscle Fatigue Progression
          </h2>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fatigueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="timeStr" 
                  tick={{ fill: '#52525b', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={30}
                />
                <YAxis 
                  tick={{ fill: '#52525b', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  formatter={(value: any) => [`${value}%`, 'Fatigue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="fatigue" 
                  stroke="url(#fatigueGradient)" 
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#18181b', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
