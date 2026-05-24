
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Home, Activity, History, LogOut, Dumbbell } from 'lucide-react';
import { cn } from '../utils/cn';

export const Layout = () => {
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/workout', icon: Activity, label: 'Workout' },
    { to: '/history', icon: History, label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* Sidebar / Topbar */}
      <nav className="bg-zinc-900 border-b md:border-r border-zinc-800 p-4 flex md:flex-col justify-between items-center md:w-64 z-10 sticky top-0 md:h-screen">
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-amber-500 mb-0 md:mb-12 w-full md:justify-start justify-center">
          <Dumbbell className="w-8 h-8" />
          <span className="hidden md:inline">RepSense</span>
        </div>
        
        <div className="flex w-full md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar px-2 md:px-0">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 min-w-fit",
                  isActive 
                    ? "bg-amber-500/10 text-amber-500" 
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="md:inline">{label}</span>
              </Link>
            )
          })}
        </div>
        
        <div className="hidden md:flex flex-col gap-4 mt-auto w-full pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-amber-500">
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-200">{user}</span>
              <span className="text-xs text-zinc-500">Pro Member</span>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Footer Logout */}
      <div className="md:hidden border-t border-zinc-800 bg-zinc-900 p-4 flex justify-between items-center pb-safe">
        <span className="text-zinc-400 font-medium">{user}</span>
        <button 
          onClick={() => setUser(null)}
          className="text-red-400 font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
