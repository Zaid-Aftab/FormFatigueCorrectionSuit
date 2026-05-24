import { create } from 'zustand';

export type FormFault = 'good_form' | 'elbow_flaring' | 'incomplete_range' | 'momentum_swinging' | 'wrist_bending';

export interface SessionDataPoint {
  time: number;
  fatigue: number;
  form: FormFault;
}

export interface WorkoutSession {
  id: string;
  date: string;
  durationSeconds: number;
  totalReps: number;
  dataPoints: SessionDataPoint[];
}

interface AppState {
  user: string | null;
  setUser: (user: string | null) => void;
  
  sessions: WorkoutSession[];
  addSession: (session: WorkoutSession) => void;
  
  isWorkingOut: boolean;
  startWorkout: () => void;
  stopWorkout: () => void;
  
  currentReps: number;
  incrementReps: (count?: number) => void;
  
  currentFatigue: number;
  setFatigue: (fatigue: number) => void;
  
  currentForm: FormFault;
  setForm: (form: FormFault) => void;
  
  sessionTimer: number;
  incrementTimer: () => void;
  
  currentDataPoints: SessionDataPoint[];
  addDataPoint: (point: SessionDataPoint) => void;

  resetWorkoutState: () => void;
}

// Generate some initial mock history
const mockSessions: WorkoutSession[] = [
  {
    id: 's-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationSeconds: 1800,
    totalReps: 45,
    dataPoints: [
      { time: 0, fatigue: 0, form: 'good_form' },
      { time: 10, fatigue: 0.2, form: 'good_form' },
      { time: 20, fatigue: 0.4, form: 'elbow_flaring' },
      { time: 30, fatigue: 0.6, form: 'good_form' },
      { time: 40, fatigue: 0.8, form: 'momentum_swinging' }
    ]
  },
  {
    id: 's-2',
    date: new Date(Date.now() - 86400000).toISOString(),
    durationSeconds: 2400,
    totalReps: 60,
    dataPoints: [
      { time: 0, fatigue: 0, form: 'good_form' },
      { time: 10, fatigue: 0.1, form: 'good_form' },
      { time: 20, fatigue: 0.3, form: 'good_form' },
      { time: 30, fatigue: 0.5, form: 'wrist_bending' },
      { time: 40, fatigue: 0.75, form: 'incomplete_range' }
    ]
  }
];

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  sessions: mockSessions,
  addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
  
  isWorkingOut: false,
  startWorkout: () => set({ 
    isWorkingOut: true, 
    currentReps: 0, 
    currentFatigue: 0, 
    currentForm: 'good_form', 
    sessionTimer: 0, 
    currentDataPoints: [] 
  }),
  stopWorkout: () => set({ isWorkingOut: false }),
  
  currentReps: 0,
  incrementReps: (count = 1) => set((state) => ({ currentReps: state.currentReps + count })),
  
  currentFatigue: 0,
  setFatigue: (fatigue) => set({ currentFatigue: fatigue }),
  
  currentForm: 'good_form',
  setForm: (form) => set({ currentForm: form }),
  
  sessionTimer: 0,
  incrementTimer: () => set((state) => ({ sessionTimer: state.sessionTimer + 1 })),
  
  currentDataPoints: [],
  addDataPoint: (point) => set((state) => ({ 
    currentDataPoints: [...state.currentDataPoints, point] 
  })),

  resetWorkoutState: () => set({
    currentReps: 0,
    currentFatigue: 0,
    currentForm: 'good_form',
    sessionTimer: 0,
    currentDataPoints: [],
    isWorkingOut: false
  })
}));
