"""
Agent Orchestrator
Manages the multi-agent diagnostic system.
"""

from typing import Dict, Any, List
from datetime import datetime
from enum import Enum

from loguru import logger
from langgraph.graph import StateGraph, END

from .vitals_agent import VitalsAgent
from .facial_agent import FacialAgent
from .audio_agent import AudioAgent
from .diagnosis_agent import DiagnosisAgent
from .treatment_agent import TreatmentAgent
from .report_agent import ReportAgent


class UrgencyLevel(Enum):
    """Urgency levels for diagnosis."""
    GREEN = "green"      # Normal, no immediate action
    YELLOW = "yellow"    # Requires attention, schedule follow-up
    RED = "red"          # Requires immediate medical attention


class DiagnosticState:
    """State shared across all agents."""
    
    def __init__(self):
        self.sensor_data: Dict[str, Any] = {}
        self.vitals: Dict[str, Any] = {}
        self.facial_analysis: Dict[str, Any] = {}
        self.audio_analysis: Dict[str, Any] = {}
        self.diagnosis: Dict[str, Any] = {}
        self.treatment: Dict[str, Any] = {}
        self.report: Dict[str, Any] = {}
        self.urgency: UrgencyLevel = UrgencyLevel.GREEN
        self.confidence: float = 0.0
        self.errors: List[str] = []


class AgentOrchestrator:
    """
    Orchestrates the multi-agent diagnostic pipeline.
    
    Flow:
    1. VitalsAgent - Processes vital signs
    2. FacialAgent - Analyzes facial/skin features
    3. AudioAgent - Analyzes audio data
    4. DiagnosisAgent - Synthesizes diagnosis
    5. TreatmentAgent - Recommends treatment
    6. ReportAgent - Generates report
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
        # Initialize agents
        self.vitals_agent = VitalsAgent(config)
        self.facial_agent = FacialAgent(config)
        self.audio_agent = AudioAgent(config)
        self.diagnosis_agent = DiagnosisAgent(config)
        self.treatment_agent = TreatmentAgent(config)
        self.report_agent = ReportAgent(config)
        
        # Build agent graph
        self.graph = self._build_graph()
        
        logger.info("Agent orchestrator initialized")
    
    def _build_graph(self) -> StateGraph:
        """Build the agent execution graph."""
        
        # Define the graph
        graph = StateGraph(DiagnosticState)
        
        # Add nodes
        graph.add_node("vitals", self.vitals_agent.process)
        graph.add_node("facial", self.facial_agent.process)
        graph.add_node("audio", self.audio_agent.process)
        graph.add_node("diagnosis", self.diagnosis_agent.process)
        graph.add_node("treatment", self.treatment_agent.process)
        graph.add_node("report", self.report_agent.process)
        
        # Define edges (parallel where possible)
        graph.set_entry_point("vitals")
        
        # Vitals, facial, and audio run in parallel
        graph.add_edge("vitals", "diagnosis")
        graph.add_edge("facial", "diagnosis")
        graph.add_edge("audio", "diagnosis")
        
        # Diagnosis -> Treatment -> Report
        graph.add_edge("diagnosis", "treatment")
        graph.add_edge("treatment", "report")
        graph.add_edge("report", END)
        
        return graph.compile()
    
    async def diagnose(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run full diagnostic pipeline.
        
        Args:
            sensor_data: Raw sensor readings from ESP32
            
        Returns:
            Complete diagnosis with report
        """
        logger.info("Starting diagnostic pipeline")
        
        # Initialize state
        state = DiagnosticState()
        state.sensor_data = sensor_data
        
        try:
            # Run the agent graph
            result = await self.graph.ainvoke(state)
            
            # Check for critical conditions
            if result.urgency == UrgencyLevel.RED:
                logger.warning("CRITICAL: Immediate medical attention required")
            
            # Build final output
            output = {
                "timestamp": datetime.now().isoformat(),
                "vitals": result.vitals,
                "facial_analysis": result.facial_analysis,
                "audio_analysis": result.audio_analysis,
                "diagnosis": result.diagnosis,
                "treatment": result.treatment,
                "report": result.report,
                "urgency": result.urgency.value,
                "confidence": result.confidence,
                "requires_doctor_review": result.confidence < 0.8 or result.urgency == UrgencyLevel.RED
            }
            
            logger.info(f"Diagnosis complete: urgency={result.urgency.value}, confidence={result.confidence:.2f}")
            
            return output
            
        except Exception as e:
            logger.error(f"Diagnosis failed: {e}")
            return self._create_error_result(str(e))
    
    def _create_error_result(self, error: str) -> Dict[str, Any]:
        """Create an error result when diagnosis fails."""
        return {
            "timestamp": datetime.now().isoformat(),
            "error": error,
            "urgency": UrgencyLevel.YELLOW.value,
            "confidence": 0.0,
            "requires_doctor_review": True,
            "recommendation": "System error occurred. Please consult a healthcare provider."
        }
