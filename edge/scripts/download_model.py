"""
Download and setup medical LLM models for BayMax-Ro1.
"""

import os
import subprocess
import sys

from loguru import logger


def check_ollama_installed() -> bool:
    """Check if Ollama is installed."""
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False


def install_ollama():
    """Install Ollama."""
    logger.info("Installing Ollama...")
    
    if sys.platform == "win32":
        # Windows: Download installer
        logger.info("Please download Ollama from: https://ollama.ai/download")
        logger.info("Run the installer and restart this script after installation.")
        sys.exit(1)
    else:
        # Linux/Mac: Use install script
        subprocess.run(
            ["curl", "-fsSL", "https://ollama.ai/install.sh", "|", "sh"],
            shell=True,
            check=True
        )


def pull_model(model_name: str):
    """Pull a model from Ollama registry."""
    logger.info(f"Pulling model: {model_name}...")
    
    try:
        subprocess.run(
            ["ollama", "pull", model_name],
            check=True
        )
        logger.info(f"Successfully pulled: {model_name}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to pull {model_name}: {e}")
        raise


def list_models():
    """List available models."""
    result = subprocess.run(
        ["ollama", "list"],
        capture_output=True,
        text=True
    )
    print(result.stdout)


def main():
    """Main setup function."""
    logger.info("BayMax-Ro1 Medical LLM Setup")
    logger.info("=" * 50)
    
    # Check if Ollama is installed
    if not check_ollama_installed():
        logger.warning("Ollama not found!")
        install_ollama()
    
    logger.info("Ollama is installed")
    
    # Models to download
    models = [
        "llama3.2:latest",           # Fallback general model
        # Medical-specific models (if available)
        # "m42-health/llama3-med42-8b",
    ]
    
    # Download models
    for model in models:
        try:
            pull_model(model)
        except Exception as e:
            logger.warning(f"Could not pull {model}: {e}")
            logger.info("Continuing with available models...")
    
    # List available models
    logger.info("\nAvailable models:")
    list_models()
    
    logger.info("\nSetup complete!")
    logger.info("Run 'python src/main.py' to start the system.")


if __name__ == "__main__":
    main()
