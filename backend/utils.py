import re
from typing import Dict, List

def sanitize_filename(filename: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)

def detect_column_mapping(columns: List[str]) -> Dict[str, str]:
    mapping = {}
    lower = [c.lower() for c in columns]
    
    for i, col in enumerate(lower):
        if any(k in col for k in ["wear", "tool_wear", "flute_wear", "vb"]):
            mapping["wear"] = columns[i]
        elif any(k in col for k in ["force", "cutting_force", "fz", "fx", "fy"]):
            mapping["force"] = columns[i]
        elif any(k in col for k in ["vib", "vibration", "accel"]):
            mapping["vibration"] = columns[i]
        elif any(k in col for k in ["acoustic", "ae"]):
            mapping["acoustic"] = columns[i]
        elif any(k in col for k in ["speed", "spindle", "rpm"]):
            mapping["speed"] = columns[i]
        elif any(k in col for k in ["feed", "feed_rate"]):
            mapping["feed"] = columns[i]
        elif any(k in col for k in ["depth", "doc"]):
            mapping["depth"] = columns[i]
        elif any(k in col for k in ["tool", "tool_id"]):
            mapping["tool_id"] = columns[i]
        elif any(k in col for k in ["cycle", "cut", "sample"]):
            mapping["cycle"] = columns[i]
            
    return mapping
