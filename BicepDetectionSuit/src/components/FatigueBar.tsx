
import { cn } from '../utils/cn';

interface FatigueBarProps {
  fatigue: number; // 0 to 1 value
  className?: string;
}

export const FatigueBar: React.FC<FatigueBarProps> = ({ fatigue, className }) => {
  // Determine color based on threshold
  let colorClass = "bg-green-500";
  if (fatigue >= 0.4 && fatigue < 0.75) {
    colorClass = "bg-amber-400";
  } else if (fatigue >= 0.75) {
    colorClass = "bg-red-500";
  }

  const percentage = Math.min(Math.max(fatigue * 100, 0), 100);

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-zinc-400">Muscle Fatigue</span>
        <span className={cn(
          "font-bold transition-colors duration-300",
          fatigue >= 0.75 ? "text-red-400" : fatigue >= 0.4 ? "text-amber-400" : "text-green-400"
        )}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50 relative">
        <div 
          className={cn("h-full transition-all duration-500 ease-out rounded-full", colorClass)}
          style={{ width: `${percentage}%` }}
        />
        {/* Glow effect */}
        <div 
          className={cn("absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out opacity-50 blur-[8px]", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
