

import warnings
warnings.filterwarnings('ignore')

import asyncio
import json
import numpy as np
from scipy import signal as sp_sig
from scipy.stats import skew, kurtosis
from collections import deque
import joblib
import websockets
import math
import time

SIMULATION_MODE = True 

FORM_MODEL_FILE    = "repsense_rf_model.pkl"
FATIGUE_MODEL_FILE = "zaid_fatigue_model.pkl"
WS_HOST            = "127.0.0.1"
WS_PORT            = 8765
FS                 = 500
ADC_MAX            = 4095.0
ADC_VREF           = 3.3

# Rep detection thresholds — tuned for real EMG sensor
REP_THRESHOLD_HIGH = 0.15   # volts — EMG peak during curl
REP_THRESHOLD_LOW  = 0.05   # volts — EMG at rest

# Fatigue baseline offset — subtract resting prediction to start near 0
FATIGUE_BASELINE   = 0.33
# ───────────────────────────────────────────────────────────────────────────────

# ── LOAD MODELS ────────────────────────────────────────────────────────────────
print("Loading models...")
form_pipeline  = joblib.load(FORM_MODEL_FILE)
fatigue_pkg    = joblib.load(FATIGUE_MODEL_FILE)
fatigue_model  = fatigue_pkg["model"]
fatigue_scaler = fatigue_pkg["scaler"]
FATIGUE_WINDOW = fatigue_pkg["window"]
print(f"Form model   — features: {list(form_pipeline.feature_names_in_)}")
print(f"Fatigue model — window: {FATIGUE_WINDOW} samples")
print("Models loaded OK")
if SIMULATION_MODE:
    print("Yes")
else:
    print("No")

# ── STATE ──────────────────────────────────────────────────────────────────────
emg_buffer       = deque(maxlen=FATIGUE_WINDOW)
last_emg_v       = 0.0
rep_high_reached = False
clients          = set()

#
sim_start        = time.time()
sim_rep_count    = 0
sim_last_rep_t   = 0.0


# ── FEATURE EXTRACTION ─────────────────────────────────────────────────────────
def compute_fatigue_features(sig: np.ndarray, fs: int = 500) -> np.ndarray:
    n = len(sig); t = 0.01
    rms   = np.sqrt(np.mean(sig**2))
    mav   = np.mean(np.abs(sig))
    wl    = np.sum(np.abs(np.diff(sig)))
    wamp  = float(np.sum(np.abs(np.diff(sig)) > t))
    ssc   = float(np.sum(((sig[1:-1]-sig[:-2])*(sig[1:-1]-sig[2:])) > 0))
    var   = np.var(sig)
    zc    = float(np.sum((sig[:-1]*sig[1:]) < 0))
    mpow  = np.mean(sig**2)
    iemg  = np.sum(np.abs(sig))
    dasdv = np.sqrt(np.mean(np.diff(sig)**2))
    log_  = np.exp(np.mean(np.log(np.abs(sig)+1e-10)))
    myop  = float(np.sum(np.abs(sig) > t) / n)
    sk    = float(skew(sig))
    ku    = float(kurtosis(sig))
    freqs, psd = sp_sig.welch(sig, fs=fs, nperseg=min(n, 128))
    tp    = float(np.sum(psd)) + 1e-10
    lo    = np.sum(psd[(freqs >= 0)   & (freqs < 60)])
    mi    = np.sum(psd[(freqs >= 60)  & (freqs < 150)])
    hi    = np.sum(psd[(freqs >= 150) & (freqs < 250)])
    lm    = lo / (mi + 1e-10)
    mf    = np.sum(freqs * psd) / tp
    sp    = np.sqrt(np.sum(((freqs - mf)**2) * psd) / tp)
    pf    = freqs[np.argmax(psd)]
    cs    = np.cumsum(psd)
    md    = freqs[min(int(np.searchsorted(cs, cs[-1]/2)), len(freqs)-1)]
    im    = np.mean(np.abs(sig))
    ist   = np.std(np.abs(sig))
    return np.array([rms,mav,wl,wamp,ssc,mf,md,var,zc,mpow,
                     iemg,dasdv,log_,myop,sk,ku,
                     lo,mi,hi,lm,sp,pf,im,ist], dtype=np.float64)


# ── REAL DATA PROCESSING ───────────────────────────────────────────────────────
def process_packet(raw: str) -> dict | None:
    global last_emg_v, rep_high_reached
    try:
        parts = raw.strip().split(",")
        if len(parts) != 4:
            return None

        emg_raw = int(parts[0].strip())
        ax      = float(parts[1].strip())
        ay      = float(parts[2].strip())
        az      = float(parts[3].strip())

        emg_v = (emg_raw / ADC_MAX) * ADC_VREF
        emg_buffer.append(emg_v)

        # Form prediction
        form_feats = np.array([[emg_v, ax, ay, az]])
        form_pred  = int(form_pipeline.predict(form_feats)[0])
        form_label = "good_form" if form_pred == 1 else "elbow_flaring"

        # Fatigue prediction
        fatigue_val = None
        if len(emg_buffer) == FATIGUE_WINDOW:
            sig    = np.array(emg_buffer, dtype=np.float64)
            sig    = sig - np.mean(sig)
            f24    = compute_fatigue_features(sig, fs=FS)
            scaled = fatigue_scaler.transform(f24.reshape(1, -1))
            proba  = fatigue_model.predict_proba(scaled)[0]
            # Subtract baseline so it starts near 0 at rest
            fatigue_val = round(max(0.0, float(proba[1]) - FATIGUE_BASELINE), 3)

        # Rep detection — peak then valley
        if emg_v >= REP_THRESHOLD_HIGH:
            rep_high_reached = True
        rep = False
        if rep_high_reached and emg_v < REP_THRESHOLD_LOW:
            rep = True
            rep_high_reached = False

        last_emg_v = emg_v

        return {"form": form_label, "fatigue": fatigue_val, "rep": rep}

    except Exception as e:
        print(f"Process error: {e} | raw: '{raw}'")
        return None



def get_simulation_packet() -> dict:
 
    global sim_rep_count, sim_last_rep_t

    now     = time.time()
    elapsed = now - sim_start

  
    rep = False
    if now - sim_last_rep_t >= 2.0:
        rep = True
        sim_rep_count += 1
        sim_last_rep_t = now

    
    fatigue = round(min(0.9, elapsed / 180.0 * 0.9), 3)

    
    bad_forms = ["elbow_flaring", "momentum_swinging", "wrist_bending", "incomplete_range"]
    if rep and sim_rep_count % 8 == 4:
        form = bad_forms[(sim_rep_count // 8) % len(bad_forms)]
    else:
        form = "good_form"

    return {"form": form, "fatigue": fatigue, "rep": rep}


# ── WEBSOCKET ──────────────────────────────────────────────────────────────────
async def broadcast(message: str):
    if not clients:
        return
    await asyncio.gather(*[c.send(message) for c in clients], return_exceptions=True)


async def simulation_loop():
    print(" 100ms")
    while True:
        if clients:
            packet = get_simulation_packet()
            await broadcast(json.dumps(packet))
        await asyncio.sleep(0.1)


async def ws_handler(websocket):
    clients.add(websocket)
    print(f"Browser connected ({len(clients)} client(s))")
    try:
        if SIMULATION_MODE:
            # In simulation mode just keep connection open — data pushed by simulation_loop
            await websocket.wait_closed()
        else:
            # Real mode — receive packets from browser Web Bluetooth and process
            async for message in websocket:
                result = process_packet(message)
                if result:
                    await broadcast(json.dumps(result))
    except Exception as e:
        print(f"WS error: {e}")
    finally:
        clients.discard(websocket)
        print(f"Browser disconnected ({len(clients)} client(s))")


async def main():
    print(f"ML WebSocket server on ws://{WS_HOST}:{WS_PORT}")
    if SIMULATION_MODE:
        print("Open the app → go to Workout → data will flow automatically")
    else:
        print("Open the app → go to Workout → click Connect to RepSense Band")

    async with websockets.serve(ws_handler, WS_HOST, WS_PORT):
        if SIMULATION_MODE:
            await simulation_loop()
        else:
            await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
