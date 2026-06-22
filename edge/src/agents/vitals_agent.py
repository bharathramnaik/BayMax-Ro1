"""
Vitals Agent
Processes vital signs from PPG, temperature, and other sensors.
"""

from typing import Dict, Any
import numpy as np

from loguru import logger


class VitalsAgent:
    """
    Processes vital signs data from sensors.
    
    Input: Raw PPG, temperature, SpO2 sensor data
    Output: Heart rate, SpO2, temperature, blood pressure estimate
    """
    
    # Physiological limits for validation
    LIMITS = {
        "heart_rate": {"min": 40, "max": 200},  # bpm
        "spo2": {"min": 70, "max": 100},         # percentage
        "temperature": {"min": 35.0, "max": 42.0},  # Celsius
        "respiratory_rate": {"min": 8, "max": 40},  # breaths/min
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        logger.info("Vitals agent initialized")
    
    async def process(self, state) -> None:
        """
        Process vital signs from sensor data.
        
        Args:
            state: DiagnosticState with sensor_data
        """
        logger.info("Processing vital signs")
        
        sensor_data = state.sensor_data
        
        try:
            # Process PPG signal for heart rate and SpO2
            ppg_data = sensor_data.get("ppg", {})
            heart_rate = self._calculate_heart_rate(ppg_data)
            spo2 = self._calculate_spo2(ppg_data)
            respiratory_rate = self._estimate_respiratory_rate(ppg_data)
            
            # Process temperature
            thermal_data = sensor_data.get("thermal", {})
            temperature = self._calculate_temperature(thermal_data)
            
            # Estimate blood pressure from PPG morphology
            bp_systolic, bp_diastolic = self._estimate_blood_pressure(ppg_data, heart_rate)
            
            # Validate readings
            validated = self._validate_readings({
                "heart_rate": heart_rate,
                "spo2": spo2,
                "temperature": temperature,
                "respiratory_rate": respiratory_rate,
                "blood_pressure": {
                    "systolic": bp_systolic,
                    "diastolic": bp_diastolic
                }
            })
            
            # Calculate confidence
            confidence = self._calculate_confidence(validated)
            
            # Update state
            state.vitals = validated
            state.confidence = max(state.confidence, confidence)
            
            logger.info(f"Vitals processed: HR={heart_rate}, SpO2={spo2}%, Temp={temperature}°C")
            
        except Exception as e:
            logger.error(f"Vitals processing failed: {e}")
            state.errors.append(f"Vitals error: {str(e)}")
    
    def _calculate_heart_rate(self, ppg_data: Dict[str, Any]) -> float:
        """Calculate heart rate from PPG signal using peak detection."""
        if not ppg_data or "signal" not in ppg_data:
            return 0.0
        
        signal = np.array(ppg_data["signal"])
        sampling_rate = ppg_data.get("sampling_rate", 100)  # Hz
        
        if len(signal) < sampling_rate:  # Need at least 1 second
            return 0.0
        
        # Bandpass filter (0.5-4 Hz for heart rate)
        filtered = self._bandpass_filter(signal, 0.5, 4.0, sampling_rate)
        
        # Peak detection
        peaks = self._detect_peaks(filtered, sampling_rate)
        
        if len(peaks) < 2:
            return 0.0
        
        # Calculate heart rate from peak intervals
        intervals = np.diff(peaks) / sampling_rate
        heart_rate = 60.0 / np.mean(intervals)
        
        return round(float(heart_rate), 1)
    
    def _calculate_spo2(self, ppg_data: Dict[str, Any]) -> float:
        """Calculate SpO2 from red and infrared PPG signals."""
        if not ppg_data:
            return 0.0
        
        red_signal = ppg_data.get("red", [])
        ir_signal = ppg_data.get("infrared", [])
        
        if not red_signal or not ir_signal:
            return 0.0
        
        red = np.array(red_signal)
        ir = np.array(ir_signal)
        
        # Calculate AC/DC components
        red_ac = np.std(red)
        red_dc = np.mean(red)
        ir_ac = np.std(ir)
        ir_dc = np.mean(ir)
        
        if ir_dc == 0 or red_dc == 0:
            return 0.0
        
        # Calculate ratio
        ratio = (red_ac / red_dc) / (ir_ac / ir_dc)
        
        # Empirical calibration (simplified)
        spo2 = 110.0 - 25.0 * ratio
        
        # Clamp to valid range
        spo2 = max(70.0, min(100.0, spo2))
        
        return round(float(spo2), 1)
    
    def _calculate_temperature(self, thermal_data: Dict[str, Any]) -> float:
        """Calculate body temperature from thermal sensor."""
        if not thermal_data:
            return 0.0
        
        object_temp = thermal_data.get("object_temp", 0.0)
        ambient_temp = thermal_data.get("ambient_temp", 25.0)
        
        # Simple calibration (needs factory calibration)
        # Real implementation would use calibration coefficients
        temperature = object_temp + 0.5  # Offset correction
        
        return round(float(temperature), 1)
    
    def _estimate_respiratory_rate(self, ppg_data: Dict[str, Any]) -> float:
        """Estimate respiratory rate from PPG signal variability."""
        if not ppg_data or "signal" not in ppg_data:
            return 0.0
        
        signal = np.array(ppg_data["signal"])
        sampling_rate = ppg_data.get("sampling_rate", 100)
        
        # Bandpass filter for respiratory rate (0.1-0.5 Hz)
        filtered = self._bandpass_filter(signal, 0.1, 0.5, sampling_rate)
        
        # Peak detection
        peaks = self._detect_peaks(filtered, sampling_rate)
        
        if len(peaks) < 2:
            return 0.0
        
        # Calculate respiratory rate
        intervals = np.diff(peaks) / sampling_rate
        respiratory_rate = 60.0 / np.mean(intervals)
        
        return round(float(respiratory_rate), 1)
    
    def _estimate_blood_pressure(self, ppg_data: Dict[str, Any], heart_rate: float) -> tuple:
        """
        Estimate blood pressure from PPG pulse wave analysis.
        
        This is a simplified estimation. Real implementation would use
        pulse transit time or machine learning models.
        """
        if not ppg_data or "signal" not in ppg_data:
            return (0.0, 0.0)
        
        signal = np.array(ppg_data["signal"])
        
        # Extract features from pulse morphology
        systolic_peak = np.max(signal)
        dicrotic_notch = np.percentile(signal, 30)
        
        # Simplified estimation (needs validation and calibration)
        # Real implementation: pulse wave analysis + ML model
        systolic = 90 + (systolic_peak / dicrotic_notch) * 20
        diastolic = 60 + (heart_rate / 10)
        
        # Clamp to reasonable range
        systolic = max(80, min(200, systolic))
        diastolic = max(50, min(120, diastolic))
        
        return (round(systolic, 1), round(diastolic, 1))
    
    def _bandpass_filter(self, signal: np.ndarray, low: float, high: float, fs: float) -> np.ndarray:
        """Apply bandpass filter to signal."""
        from scipy.signal import butter, filtfilt
        
        nyquist = fs / 2
        low_norm = low / nyquist
        high_norm = high / nyquist
        
        b, a = butter(4, [low_norm, high_norm], btype='band')
        filtered = filtfilt(b, a, signal)
        
        return filtered
    
    def _detect_peaks(self, signal: np.ndarray, fs: float) -> list:
        """Detect peaks in signal."""
        from scipy.signal import find_peaks
        
        # Minimum distance between peaks (based on max heart rate)
        min_distance = int(fs * 60 / 200)  # 200 bpm max
        
        peaks, _ = find_peaks(signal, distance=min_distance)
        
        return peaks.tolist()
    
    def _validate_readings(self, readings: Dict[str, Any]) -> Dict[str, Any]:
        """Validate readings against physiological limits."""
        validated = {}
        
        for key, value in readings.items():
            if key in self.LIMITS:
                limits = self.LIMITS[key]
                if isinstance(value, (int, float)):
                    validated[key] = max(limits["min"], min(limits["max"], value))
                    validated[f"{key}_valid"] = limits["min"] <= value <= limits["max"]
                else:
                    validated[key] = value
                    validated[f"{key}_valid"] = True
            else:
                validated[key] = value
        
        return validated
    
    def _calculate_confidence(self, vitals: Dict[str, Any]) -> float:
        """Calculate confidence score based on reading validity."""
        valid_count = sum(1 for k, v in vitals.items() if k.endswith("_valid") and v)
        total_count = sum(1 for k in vitals.keys() if k.endswith("_valid"))
        
        if total_count == 0:
            return 0.0
        
        return valid_count / total_count
