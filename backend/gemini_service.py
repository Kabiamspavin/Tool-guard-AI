import os
from typing import Dict, Any, List
from google import genai
from .config import settings

def get_gemini_client():
    key = settings.GEMINI_API_KEY
    if not key or key == "MY_GEMINI_API_KEY":
        return None
    return genai.Client(api_key=key)

def ask_copilot(message: str, context: Dict[str, Any], history: List[Dict[str, str]] = None) -> str:
    client = get_gemini_client()
    if not client:
        return (
            "ToolGuard Copilot Notice: Gemini API Key is not configured. "
            "Core XGBoost prediction and SHAP explainability remain active."
        )
        
    prompt = f"""
You are "ToolGuard Copilot", an AI assistant for CNC predictive maintenance and cutting tool wear analysis.
Context:
- Predicted Wear: {context.get('predictedWear', 'N/A')} mm
- Risk Level: {context.get('riskLevel', 'N/A')}
- Sensor Readings: {context.get('sensorValues', {})}
- Top Contributing Features (SHAP): {context.get('topFeatures', [])}
- Model Validation Metrics: {context.get('modelMetrics', 'Trained XGBoost')}

Rule: Ground your explanations in real cutting physics. Do NOT hallucinate values.
User query: {message}
"""
    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"AI assistant unavailable. Core XGBoost prediction remains available. Error: {str(e)}"

def generate_maintenance_report(context: Dict[str, Any]) -> str:
    client = get_gemini_client()
    if not client:
        return f"""# CNC Predictive Maintenance Report
Tool ID: {context.get('toolId', 'Tool_T01')}
Predicted Flank Wear: {context.get('predictedWear', '0.183')} mm
Risk Level: {context.get('riskLevel', 'MEDIUM')}
Notice: Model predictions serve as decision support, not guaranteed failure. Adhere to plant safety SOPs."""

    prompt = f"""
Generate an industrial engineering CNC Tool Maintenance Report based on:
- Tool: {context.get('toolId', 'Tool T01')}
- Predicted Wear: {context.get('predictedWear')} mm
- Risk: {context.get('riskLevel')}
- Telemetry: {context.get('sensorValues')}
- Top SHAP Factors: {context.get('topFeatures')}
"""
    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Report generation error: {str(e)}"
