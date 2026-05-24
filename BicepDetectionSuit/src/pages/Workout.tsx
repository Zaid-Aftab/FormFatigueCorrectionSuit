import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { FormBadge } from '../components/FormBadge';
import { FatigueBar } from '../components/FatigueBar';
import { StopCircle, AlertTriangle, Disc3, WifiOff, Bluetooth } from 'lucide-react';
import { cn } from '../utils/cn';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const WS_URL      = 'ws://127.0.0.1:8765';
const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const CHAR_UUID    = 'abcd1234-ab12-ab12-ab12-abcdef123456';
// ─────────────────────────────────────────────────────────────────────────────

export const Workout = () => {
  const navigate = useNavigate();
  const wsRef    = useRef<WebSocket | null>(null);
  const bleRef   = useRef<BluetoothRemoteGATTServer | null>(null);

  const [wsConnected,  setWsConnected]  = useState(false);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleStatus,    setBleStatus]    = useState('Not connected');

  // ── Zustand selectors ──────────────────────────────────────────────────────
  const isWorkingOut      = useAppStore(s => s.isWorkingOut);
  const startWorkout      = useAppStore(s => s.startWorkout);
  const stopWorkout       = useAppStore(s => s.stopWorkout);
  const currentReps       = useAppStore(s => s.currentReps);
  const currentFatigue    = useAppStore(s => s.currentFatigue);
  const currentForm       = useAppStore(s => s.currentForm);
  const sessionTimer      = useAppStore(s => s.sessionTimer);
  const incrementTimer    = useAppStore(s => s.incrementTimer);
  const incrementReps     = useAppStore(s => s.incrementReps);
  const setFatigue        = useAppStore(s => s.setFatigue);
  const setForm           = useAppStore(s => s.setForm);
  const addDataPoint      = useAppStore(s => s.addDataPoint);
  const currentDataPoints = useAppStore(s => s.currentDataPoints);
  const resetWorkoutState = useAppStore(s => s.resetWorkoutState);
  const addSession        = useAppStore(s => s.addSession);

  // Start workout on mount
  useEffect(() => {
    resetWorkoutState();
    startWorkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session timer
  useEffect(() => {
    if (!isWorkingOut) return;
    const id = setInterval(() => incrementTimer(), 1000);
    return () => clearInterval(id);
  }, [isWorkingOut, incrementTimer]);

  // WebSocket to Python ML server
  useEffect(() => {
    if (!isWorkingOut) return;

    const connect = () => {
      console.log('Connecting to ML server...');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('ML server connected');
        setWsConnected(true);
      };

      // Receive predictions FROM Python
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Prediction:', data);

          if (data.form != null)    setForm(data.form);
          if (data.fatigue != null) setFatigue(data.fatigue);
          if (data.rep === true)    incrementReps(1);

          addDataPoint({
            time:    useAppStore.getState().sessionTimer,
            fatigue: data.fatigue ?? useAppStore.getState().currentFatigue,
            form:    data.form    ?? useAppStore.getState().currentForm,
          });
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('ML server disconnected — retrying in 2s...');
        setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => { wsRef.current?.close(); wsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkingOut]);

  // Connect to ESP32 via Web Bluetooth (Chrome only)
  const connectBLE = async () => {
    try {
      setBleStatus('Scanning...');
      console.log('Requesting BLE device...');

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: 'RepSense' }],
        optionalServices: [SERVICE_UUID],
      });

      device.addEventListener('gattserverdisconnected', () => {
        console.log('BLE disconnected');
        setBleConnected(false);
        setBleStatus('Disconnected — reconnect below');
      });

      setBleStatus('Connecting...');
      const server  = await device.gatt.connect();
      bleRef.current = server;

      const service = await server.getPrimaryService(SERVICE_UUID);
      const char    = await service.getCharacteristic(CHAR_UUID);

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (event: any) => {
        const raw = new TextDecoder().decode(event.target.value);
        // Forward raw packet to Python ML server
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(raw);
        }
      });

      setBleConnected(true);
      setBleStatus('Connected to RepSense');
      console.log('BLE connected and streaming');

    } catch (err: any) {
      console.error('BLE error:', err);
      setBleStatus(`Error: ${err.message}`);
      setBleConnected(false);
    }
  };

  const handleStop = () => {
    bleRef.current?.disconnect();
    wsRef.current?.close();
    stopWorkout();
    const id = `s-${Date.now()}`;
    addSession({
      id,
      date:            new Date().toISOString(),
      durationSeconds: sessionTimer,
      totalReps:       currentReps,
      dataPoints:      [...currentDataPoints],
    });
    navigate(`/session/${id}`);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isResting = currentFatigue > 0.75;

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-2xl mx-auto">

      {/* Timer */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden relative">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">LIVE</span>
        </div>
        <div className="flex flex-col text-center w-full mt-2">
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-2">Timer</span>
          <span className="text-5xl font-mono font-black tracking-tighter text-white tabular-nums drop-shadow-md">
            {formatTime(sessionTimer)}
          </span>
        </div>
      </div>

      {/* BLE Connect button — shows until connected */}
      {!bleConnected && (
        <button
          onClick={connectBLE}
          className="w-full bg-blue-600/10 hover:bg-blue-600/20 border-2 border-blue-600/50 text-blue-400 font-black uppercase tracking-widest text-base p-4 rounded-2xl transition-all flex justify-center items-center gap-3 active:scale-95"
        >
          <Bluetooth className="w-5 h-5" />
          Connect to RepSense Band
          <span className="text-xs font-normal normal-case opacity-60 ml-1">({bleStatus})</span>
        </button>
      )}

      {bleConnected && (
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {bleStatus}
        </div>
      )}

      {/* Rep counter + form */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] transition-colors duration-700 opacity-30 pointer-events-none",
          isResting ? "bg-red-500" : currentForm === 'good_form' ? "bg-green-500" : "bg-red-500"
        )} />

        <div className="relative z-10 flex flex-col items-center w-full">
          <span className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-4">Rep Counter</span>
          <span className="text-[12rem] leading-none font-black text-white tabular-nums tracking-tighter">
            {currentReps}
          </span>

          <div className="h-16 mt-8 flex w-full justify-center items-center">
            {isResting ? (
              <div className="animate-pulse bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-3 rounded-full flex items-center gap-3 font-black uppercase tracking-widest">
                <AlertTriangle className="w-6 h-6" />
                <span>Rest Now</span>
              </div>
            ) : (
              <FormBadge form={currentForm} className="text-lg px-6 py-3" />
            )}
          </div>
        </div>
      </div>

      {/* Fatigue bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <FatigueBar fatigue={currentFatigue} />
      </div>

      {/* Stop */}
      <button
        onClick={handleStop}
        className="w-full bg-red-600/10 hover:bg-red-600/20 border-2 border-red-600/50 text-red-500 font-black uppercase tracking-widest text-lg p-6 rounded-3xl transition-all flex justify-center items-center gap-3 mt-auto active:scale-95"
      >
        <StopCircle className="w-8 h-8" />
        Finish Workout
      </button>

      {/* Status bar */}
      <div className="fixed bottom-4 right-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-3 text-xs text-zinc-400 font-mono shadow-xl z-50">
        {wsConnected && bleConnected ? (
          <><Disc3 className="w-4 h-4 animate-spin text-amber-500" /> AI Vision Active</>
        ) : wsConnected ? (
          <><Bluetooth className="w-4 h-4 text-blue-400" /> ML Ready — connect band</>
        ) : (
          <><WifiOff className="w-4 h-4 text-red-500" /> Connecting to ML server...</>
        )}
      </div>

    </div>
  );
};
