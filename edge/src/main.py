"""
BayMax-Ro1 Edge AI System
Main entry point for the diagnostic system.
"""

import asyncio
import sys
from pathlib import Path

from loguru import logger

from src.config import load_config
from src.agents.orchestrator import AgentOrchestrator
from src.sensors.sensor_manager import SensorManager
from src.output.display import DisplayManager
from src.output.communications import CommunicationManager


class BayMaxSystem:
    """Main system orchestrator for BayMax-Ro1."""
    
    def __init__(self, config_path: str = "config/settings.yaml"):
        self.config = load_config(config_path)
        self.orchestrator = AgentOrchestrator(self.config)
        self.sensor_manager = SensorManager(self.config)
        self.display = DisplayManager(self.config)
        self.comms = CommunicationManager(self.config)
        
        logger.info("BayMax-Ro1 system initialized")
    
    async def start(self):
        """Start the diagnostic system."""
        logger.info("Starting BayMax-Ro1 diagnostic system...")
        
        # Initialize hardware
        await self.sensor_manager.initialize()
        await self.display.initialize()
        await self.comms.initialize()
        
        # Run main loop
        await self._main_loop()
    
    async def _main_loop(self):
        """Main processing loop."""
        while True:
            try:
                # Read sensors
                sensor_data = await self.sensor_manager.read_all()
                
                # Run diagnosis
                result = await self.orchestrator.diagnose(sensor_data)
                
                # Display results
                await self.display.show_result(result)
                
                # Send to health worker app
                await self.comms.send_result(result)
                
                # Wait for next scan
                await asyncio.sleep(self.config.scan_interval)
                
            except KeyboardInterrupt:
                logger.info("System shutdown requested")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await self.display.show_error(str(e))
                await asyncio.sleep(5)
    
    async def shutdown(self):
        """Graceful shutdown."""
        logger.info("Shutting down BayMax-Ro1...")
        await self.sensor_manager.shutdown()
        await self.display.shutdown()
        await self.comms.shutdown()


def main():
    """Main entry point."""
    logger.add("logs/baymax_{time}.log", rotation="1 day")
    
    system = BayMaxSystem()
    
    try:
        asyncio.run(system.start())
    except KeyboardInterrupt:
        logger.info("System interrupted")
    finally:
        asyncio.run(system.shutdown())


if __name__ == "__main__":
    main()
