from typing import Dict, Any

def classify_tool_health(wear: float, low: float = 0.10, med: float = 0.20, high: float = 0.30) -> Dict[str, str]:
    """
    Classifies tool wear into risk categories and supplies operational recommendations.
    Configurable via user settings.
    """
    if wear < low:
        return {
            "risk_level": "LOW",
            "tool_health": "Normal Operation",
            "recommended_action": "Continue operation and monitor sensor trends."
        }
    elif wear < med:
        return {
            "risk_level": "MEDIUM",
            "tool_health": "Moderate Wear",
            "recommended_action": "Increase monitoring frequency and inspect tool condition at next scheduled stop."
        }
    elif wear < high:
        return {
            "risk_level": "HIGH",
            "tool_health": "High Wear",
            "recommended_action": "Schedule tool inspection and evaluate replacement timing before finish cut."
        }
    else:
        return {
            "risk_level": "CRITICAL",
            "tool_health": "Critical Wear / End-of-Life",
            "recommended_action": "Stop or isolate the affected operation according to plant safety procedures and inspect the tool."
        }
