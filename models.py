from pydantic import BaseModel
from typing import Optional
from datetime import time

# This is the data model for a new catch entry
class CatchCreate(BaseModel):
    time: time
    location: str  # Could be GPS coords or a name
    structure: str
    water_temp: float
    water_quality: str
    line_type: str
    boat_depth: float
    bait_depth: float
    bait: str
    bait_type: str
    bait_colour: str
    scented: bool
    fish_weight: float
    comments: Optional[str] = None  # This field is optional

# This model represents a full catch record from the database (includes a unique ID)
class Catch(CatchCreate):
    id: str

# Model for analysis parameters (e.g., what to analyze)
class AnalysisRequest(BaseModel):
    analysis_type: str  # e.g., "bait_success", "time_analysis"
    parameter: Optional[str] = None