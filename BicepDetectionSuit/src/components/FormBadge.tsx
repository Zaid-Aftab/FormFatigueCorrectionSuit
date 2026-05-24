
import { cn } from '../utils/cn';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { FormFault } from '../store/useAppStore';

const formLabels: Record<FormFault, string> = {
  good_form: 'Good Form',
  elbow_flaring: 'Elbows Flaring Out',
  incomplete_range: 'Incomplete Range of Motion',
  momentum_swinging: 'Using Body Momentum',
  wrist_bending: 'Wrist Not Neutral'
};

interface FormBadgeProps {
  form: FormFault;
  className?: string;
}

export const FormBadge: React.FC<FormBadgeProps> = ({ form, className }) => {
  const isGood = form === 'good_form';
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300",
      isGood ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30",
      className
    )}>
      {isGood ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span>{formLabels[form]}</span>
    </div>
  );
};
