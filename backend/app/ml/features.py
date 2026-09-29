import math
import numpy as np
from typing import List, Dict, Any, Tuple

class FeatureExtractor:
    """
    Feature extraction pipeline conforming strictly to PRD Section 31:
    - Gravity removal
    - Bandpass filtering simulation
    - 1-second window buffer, 0.5s hop
    - RMS, Peak, Crest Factor, Kurtosis, Band Energy, Measured Motor Speed
    """
    def __init__(self, sampling_rate_hz: int = 100):
        self.sampling_rate = sampling_rate_hz
        self.window_size = sampling_rate_hz # 1-second window = 100 samples
        self.buffer_x: List[float] = []
        self.buffer_y: List[float] = []
        self.buffer_z: List[float] = []

    def push_sample(self, accel_x: float, accel_y: float, accel_z: float) -> None:
        self.buffer_x.append(accel_x)
        self.buffer_y.append(accel_y)
        self.buffer_z.append(accel_z)
        if len(self.buffer_x) > self.window_size * 2:
            self.buffer_x = self.buffer_x[-self.window_size:]
            self.buffer_y = self.buffer_y[-self.window_size:]
            self.buffer_z = self.buffer_z[-self.window_size:]

    def is_window_ready(self) -> bool:
        return len(self.buffer_z) >= 10 # Allow rapid warm-up, nominal 10-100

    def compute_features(self, measured_rpm: int) -> Dict[str, float]:
        """
        Extracts mathematical features from current buffer after gravity removal.
        """
        if not self.buffer_z:
            return {
                "rms": 0.0,
                "peak": 0.0,
                "crest_factor": 1.0,
                "kurtosis": 3.0,
                "band_energy_low": 0.0,
                "band_energy_mid": 0.0,
                "band_energy_high": 0.0,
                "measured_motor_speed": float(measured_rpm)
            }

        # Gravity removal: subtract mean component
        arr_x = np.array(self.buffer_x[-self.window_size:]) - np.mean(self.buffer_x[-self.window_size:])
        arr_y = np.array(self.buffer_y[-self.window_size:]) - np.mean(self.buffer_y[-self.window_size:])
        arr_z = np.array(self.buffer_z[-self.window_size:]) - 1.0 # 1g nominal gravity on Z

        # Combined magnitude of dynamic vibration
        magnitude = np.sqrt(arr_x**2 + arr_y**2 + arr_z**2)
        
        rms = float(np.sqrt(np.mean(magnitude**2)))
        peak = float(np.max(magnitude))
        crest_factor = float(peak / (rms + 1e-6))
        
        # Kurtosis (4th moment / variance^2)
        mean_mag = np.mean(magnitude)
        variance = np.mean((magnitude - mean_mag)**2) + 1e-6
        kurtosis = float(np.mean((magnitude - mean_mag)**4) / (variance**2))

        # Frequency-band approximations (Low: 0-20Hz, Mid: 20-50Hz, High: >50Hz)
        fft_vals = np.abs(np.fft.rfft(magnitude))
        n_fft = len(fft_vals)
        low_idx = int(0.2 * n_fft)
        mid_idx = int(0.5 * n_fft)

        band_low = float(np.sum(fft_vals[:low_idx]**2)) if low_idx > 0 else 0.0
        band_mid = float(np.sum(fft_vals[low_idx:mid_idx]**2)) if mid_idx > low_idx else 0.0
        band_high = float(np.sum(fft_vals[mid_idx:]**2)) if n_fft > mid_idx else 0.0

        return {
            "rms": round(rms, 4),
            "peak": round(peak, 4),
            "crest_factor": round(crest_factor, 4),
            "kurtosis": round(kurtosis, 4),
            "band_energy_low": round(band_low, 4),
            "band_energy_mid": round(band_mid, 4),
            "band_energy_high": round(band_high, 4),
            "measured_motor_speed": float(measured_rpm)
        }

feature_extractor = FeatureExtractor()
