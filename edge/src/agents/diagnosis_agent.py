"""
Diagnosis Agent
Uses medical LLM to synthesize diagnosis from all agent outputs.
"""

from typing import Dict, Any, List
from datetime import datetime

from loguru import logger


class DiagnosisAgent:
    """
    Synthesizes diagnosis using medical LLM.
    
    Input: Vitals, facial analysis, audio analysis
    Output: Differential diagnosis with confidence scores
    """
    
    # Common conditions for initial screening
    SCREENING_CONDITIONS = {
        "cardiovascular": [
            "hypertension", "tachycardia", "bradycardia", "arrhythmia"
        ],
        "respiratory": [
            "respiratory infection", "asthma", "copd"
        ],
        "metabolic": [
            "diabetes", "fever", "hypothermia"
        ],
        "general": [
            "anemia", "dehydration", "fatigue"
        ]
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.llm_client = None  # Will be initialized with model
        self._initialize_llm()
        
        logger.info("Diagnosis agent initialized")
    
    def _initialize_llm(self):
        """Initialize the medical LLM."""
        try:
            import ollama
            
            model_name = self.config.get("medical_llm", "med42-v2-8b")
            
            # Check if model is available
            models = ollama.list()
            available = [m["name"] for m in models["models"]]
            
            if model_name not in available:
                logger.warning(f"Model {model_name} not found. Using default.")
                model_name = "llama3.2:latest"
            
            self.llm_client = ollama
            self.model_name = model_name
            
            logger.info(f"Using medical LLM: {model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            self.llm_client = None
    
    async def process(self, state) -> None:
        """
        Generate diagnosis from all agent outputs.
        
        Args:
            state: DiagnosticState with all agent results
        """
        logger.info("Generating diagnosis")
        
        try:
            # Build prompt with all available data
            prompt = self._build_diagnosis_prompt(state)
            
            # Get diagnosis from LLM
            if self.llm_client:
                diagnosis = await self._query_llm(prompt)
            else:
                diagnosis = self._rule_based_diagnosis(state)
            
            # Parse and validate diagnosis
            parsed = self._parse_diagnosis(diagnosis, state)
            
            # Update state
            state.diagnosis = parsed
            state.confidence = parsed.get("confidence", 0.0)
            
            # Determine urgency
            state.urgency = self._determine_urgency(parsed, state)
            
            logger.info(f"Diagnosis generated: {len(parsed.get('differentials', []))} conditions")
            
        except Exception as e:
            logger.error(f"Diagnosis failed: {e}")
            state.errors.append(f"Diagnosis error: {str(e)}")
            state.diagnosis = {"error": str(e)}
    
    def _build_diagnosis_prompt(self, state) -> str:
        """Build comprehensive prompt for diagnosis."""
        
        prompt = """You are an AI medical assistant helping healthcare workers in underserved areas.
Based on the following patient data, provide a differential diagnosis.

## Patient Vitals
"""
        
        # Add vitals
        vitals = state.vitals
        if vitals:
            prompt += f"""
- Heart Rate: {vitals.get('heart_rate', 'N/A')} bpm
- SpO2: {vitals.get('spo2', 'N/A')}%
- Temperature: {vitals.get('temperature', 'N/A')}°C
- Respiratory Rate: {vitals.get('respiratory_rate', 'N/A')} breaths/min
- Blood Pressure: {vitals.get('blood_pressure', {}).get('systolic', 'N/A')}/{vitals.get('blood_pressure', {}).get('diastolic', 'N/A')} mmHg
"""
        
        # Add facial analysis
        facial = state.facial_analysis
        if facial:
            prompt += f"""
## Facial/Skin Analysis
- Skin Color: {facial.get('skin_color', 'N/A')}
- Eye Clarity: {facial.get('eye_clarity', 'N/A')}
- Signs of Jaundice: {facial.get('jaundice', False)}
- Signs of Anemia: {facial.get('anemia_signs', False)}
"""
        
        # Add audio analysis
        audio = state.audio_analysis
        if audio:
            prompt += f"""
## Audio Analysis
- Cough Detected: {audio.get('cough_detected', False)}
- Cough Type: {audio.get('cough_type', 'N/A')}
- Breathing Sounds: {audio.get('breathing_sounds', 'N/A')}
- Voice Quality: {audio.get('voice_quality', 'N/A')}
"""
        
        # Add symptoms if provided
        symptoms = state.sensor_data.get("symptoms", [])
        if symptoms:
            prompt += f"""
## Reported Symptoms
{chr(10).join(f'- {s}' for s in symptoms)}
"""
        
        prompt += """
## Instructions
1. Provide top 3 differential diagnoses with confidence scores (0-100%)
2. For each diagnosis, list key supporting evidence
3. Recommend immediate actions if any critical condition suspected
4. Identify what additional tests would help confirm diagnosis

Format your response as:
PRIMARY: [Most likely diagnosis] (confidence: X%)
SECONDARY: [Second possibility] (confidence: X%)
TERTIARY: [Third possibility] (confidence: X%)
URGENCY: [GREEN/YELLOW/RED]
RECOMMENDATIONS: [List of immediate actions]
ADDITIONAL_TESTS: [Tests needed]
"""
        
        return prompt
    
    async def _query_llm(self, prompt: str) -> str:
        """Query the medical LLM."""
        try:
            response = self.llm_client.chat(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a medical AI assistant. Provide accurate, evidence-based diagnoses. Always recommend consulting a healthcare professional."},
                    {"role": "user", "content": prompt}
                ],
                options={
                    "temperature": 0.3,  # Low temperature for factual responses
                    "top_p": 0.9,
                    "num_predict": 500
                }
            )
            
            return response["message"]["content"]
            
        except Exception as e:
            logger.error(f"LLM query failed: {e}")
            return self._rule_based_diagnosis(None)
    
    def _rule_based_diagnosis(self, state) -> str:
        """Fallback rule-based diagnosis when LLM is unavailable."""
        
        if not state:
            return "Unable to perform diagnosis. Please consult a healthcare provider."
        
        vitals = state.vitals
        findings = []
        
        # Check vital signs
        hr = vitals.get("heart_rate", 0)
        spo2 = vitals.get("spo2", 0)
        temp = vitals.get("temperature", 0)
        bp = vitals.get("blood_pressure", {})
        
        if hr > 100:
            findings.append("Tachycardia detected")
        elif hr < 60:
            findings.append("Bradycardia detected")
        
        if spo2 < 94:
            findings.append("Low oxygen saturation detected")
        
        if temp > 37.5:
            findings.append("Elevated temperature detected")
        elif temp < 36.0:
            findings.append("Low body temperature detected")
        
        systolic = bp.get("systolic", 0)
        diastolic = bp.get("diastolic", 0)
        
        if systolic > 140 or diastolic > 90:
            findings.append("Elevated blood pressure detected")
        elif systolic < 90 or diastolic < 60:
            findings.append("Low blood pressure detected")
        
        if not findings:
            return "Vital signs appear within normal ranges. Continue monitoring."
        
        return f"Findings: {'. '.join(findings)}. Recommend consulting healthcare provider."
    
    def _parse_diagnosis(self, diagnosis_text: str, state) -> Dict[str, Any]:
        """Parse LLM diagnosis into structured format."""
        
        parsed = {
            "raw_text": diagnosis_text,
            "differentials": [],
            "confidence": 0.0,
            "recommendations": [],
            "additional_tests": []
        }
        
        # Parse differential diagnoses
        lines = diagnosis_text.split("\n")
        for line in lines:
            line = line.strip()
            
            if line.startswith("PRIMARY:"):
                parsed["differentials"].append(self._parse_diagnosis_line(line, "primary"))
            elif line.startswith("SECONDARY:"):
                parsed["differentials"].append(self._parse_diagnosis_line(line, "secondary"))
            elif line.startswith("TERTIARY:"):
                parsed["differentials"].append(self._parse_diagnosis_line(line, "tertiary"))
            elif line.startswith("URGENCY:"):
                urgency_str = line.split(":")[-1].strip().upper()
                parsed["urgency"] = urgency_str
            elif line.startswith("RECOMMENDATIONS:"):
                recs = line.split(":")[-1].strip()
                parsed["recommendations"] = [r.strip() for r in recs.split(",")]
            elif line.startswith("ADDITIONAL_TESTS:"):
                tests = line.split(":")[-1].strip()
                parsed["additional_tests"] = [t.strip() for t in tests.split(",")]
        
        # Calculate average confidence
        if parsed["differentials"]:
            confidences = [d.get("confidence", 0) for d in parsed["differentials"]]
            parsed["confidence"] = sum(confidences) / len(confidences) / 100
        
        # Add vital signs summary
        parsed["vitals_summary"] = state.vitals
        
        return parsed
    
    def _parse_diagnosis_line(self, line: str, rank: str) -> Dict[str, Any]:
        """Parse a single diagnosis line."""
        import re
        
        # Extract diagnosis and confidence
        match = re.search(r'(?:PRIMARY|SECONDARY|TERTIARY):\s*(.+?)\s*\(confidence:\s*(\d+)%\)', line)
        
        if match:
            return {
                "diagnosis": match.group(1).strip(),
                "confidence": int(match.group(2)),
                "rank": rank
            }
        
        # Fallback parsing
        parts = line.split(":")
        if len(parts) >= 2:
            diagnosis = parts[1].strip().split("(")[0].strip()
            return {
                "diagnosis": diagnosis,
                "confidence": 50,  # Default confidence
                "rank": rank
            }
        
        return {"diagnosis": "Unknown", "confidence": 0, "rank": rank}
    
    def _determine_urgency(self, diagnosis: Dict[str, Any], state) -> str:
        """Determine urgency level based on diagnosis and vitals."""
        
        # Check for critical vital signs
        vitals = state.vitals
        
        # Critical thresholds
        if vitals.get("spo2", 100) < 90:
            return "red"
        if vitals.get("heart_rate", 0) > 150 or vitals.get("heart_rate", 0) < 40:
            return "red"
        if vitals.get("temperature", 37) > 40:
            return "red"
        
        bp = vitals.get("blood_pressure", {})
        if bp.get("systolic", 120) > 180 or bp.get("systolic", 120) < 80:
            return "red"
        
        # Check diagnosis urgency
        diag_urgency = diagnosis.get("urgency", "GREEN").upper()
        if diag_urgency == "RED":
            return "red"
        elif diag_urgency == "YELLOW":
            return "yellow"
        
        # Check confidence
        if diagnosis.get("confidence", 0) < 0.5:
            return "yellow"
        
        return "green"
