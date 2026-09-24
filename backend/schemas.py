from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class PredictionInput(BaseModel):
    toolId: str = Field(default="Tool_T01")
    cycle: int = Field(default=50)
    cuttingForce: float = Field(default=180.0, description="Resultant cutting force in Newtons")
    vibration: float = Field(default=0.22, description="Vibration RMS in g")
    acousticEmission: float = Field(default=0.06, description="Acoustic emission in Volts")
    spindleSpeed: float = Field(default=10400.0, description="Spindle speed in RPM")
    feedRate: float = Field(default=1550.0, description="Feed rate in mm/min")
    depthOfCut: float = Field(default=0.75, description="Axial depth of cut in mm")

class PredictionResponse(BaseModel):
    toolId: str
    cycle: int
    predictedWear: float
    riskLevel: str
    toolHealth: str
    rulCycles: Optional[int] = None
    recommendedAction: str
    timestamp: datetime

class TrainRequest(BaseModel):
    targetColumn: str = "tool_wear"
    toolIdColumn: Optional[str] = "tool_id"
    cycleColumn: Optional[str] = "cycle"
    nEstimators: int = 300
    maxDepth: int = 6
    learningRate: float = 0.05
    subsample: float = 0.8
    colsampleBytree: float = 0.8

class ModelMetricsResponse(BaseModel):
    trained: bool
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None
    trainSamples: Optional[int] = None
    testSamples: Optional[int] = None
    featureImportance: Optional[Dict[str, float]] = None

class ShapResponse(BaseModel):
    baseValue: float
    predictedValue: float
    shapValues: List[Dict[str, Any]]
    topDrivers: List[Dict[str, Any]]
    explanationText: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, str]]] = None

class MaintenanceReportRequest(BaseModel):
    context: Dict[str, Any]
