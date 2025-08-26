from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import time
import pandas as pd
from bson import ObjectId
from bson import json_util
import json
import csv
import io
import os

# --- Pydantic Models (Data Validation) ---
# Model for creating a new catch
class CatchCreate(BaseModel):
    date: Optional[str] = Field(None, example="2024-01-15")  # Optional for backward compatibility
    time: str = Field(..., example="07:30:00")
    location: str = Field(..., example="24°50'42\"S 29°26'16\"E")
    lake: Optional[str] = Field(None, example="Lake Serene")  # Optional for backward compatibility
    structure: str = Field(..., example="Weeds")
    water_temp: float = Field(..., example=22.5)
    water_quality: str = Field(..., example="Clear")
    line_type: str = Field(..., example="Braid")
    boat_depth: float = Field(..., example=10.0)
    bait_depth: float = Field(..., example=2.0)
    bait: str = Field(..., example="Senko")
    bait_type: str = Field(..., example="Soft")
    bait_colour: str = Field(..., example="Green Pumpkin")
    scented: bool = Field(..., example=False)
    fish_weight: float = Field(..., example=1.5)
    comments: Optional[str] = Field(None, example="Good Fight")

# Model for responding with catch data (includes the ID)
class CatchResponse(BaseModel):
    id: str = Field(alias="_id")
    date: Optional[str] = Field(None, example="2024-01-15")
    time: str = Field(..., example="07:30:00")
    location: str = Field(..., example="24°50'42\"S 29°26'16\"E")
    lake: Optional[str] = Field(None, example="Lake Serene")
    structure: str = Field(..., example="Weeds")
    water_temp: float = Field(..., example=22.5)
    water_quality: str = Field(..., example="Clear")
    line_type: str = Field(..., example="Braid")
    boat_depth: float = Field(..., example=10.0)
    bait_depth: float = Field(..., example=2.0)
    bait: str = Field(..., example="Senko")
    bait_type: str = Field(..., example="Soft")
    bait_colour: str = Field(..., example="Green Pumpkin")
    scented: bool = Field(..., example=False)
    fish_weight: float = Field(..., example=1.5)
    comments: Optional[str] = Field(None, example="Good Fight")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

# Model for requesting analysis
class AnalysisRequest(BaseModel):
    analysis_type: str = Field(..., example="bait_success")
    parameter: Optional[str] = Field(None, example="Spinner Bait")

# Model for bulk upload response
class BulkUploadResponse(BaseModel):
    success: bool
    message: str
    details: Dict[str, Any]

# --- FastAPI App Setup ---
app = FastAPI(
    title="BiteTracker API",
    description="A backend API for logging and analyzing fishing catch data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Get MongoDB URI from environment variable, default to localhost for development
MONGO_URL = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "bite_tracker_db")

# Initialize MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
catches_collection = db.catches

# Get the frontend URL from environment variable, with localhost as fallback
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        await db.command("ping")
        print("✅ MongoDB connection successful!")
        print(f"✅ Connected to database: {DB_NAME}")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print(f"❌ Connection string used: {MONGO_URL}")

@app.get("/")
async def root():
    return {"message": "Welcome to the BiteTracker API! Check /docs for documentation."}

# --- Updated endpoints with string ID handling ---
@app.post("/catches/", response_model=CatchResponse)
async def create_catch(catch: CatchCreate):
    try:
        catch_dict = catch.model_dump()
        result = await catches_collection.insert_one(catch_dict)
        created_catch = await catches_collection.find_one({"_id": result.inserted_id})
        
        if created_catch:
            # Convert ObjectId to string for the response
            created_catch["_id"] = str(created_catch["_id"])
            return CatchResponse(**created_catch)
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve created document")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/catches/", response_model=List[CatchResponse])
async def get_all_catches():
    try:
        catches = []
        async for document in catches_collection.find():
            # Convert ObjectId to string and add default values
            document["_id"] = str(document["_id"])
            document.setdefault('date', None)
            document.setdefault('lake', None)
            catches.append(CatchResponse(**document))
        return catches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/catches/{catch_id}", response_model=CatchResponse)
async def get_catch(catch_id: str):
    try:
        if (catch := await catches_collection.find_one({"_id": ObjectId(catch_id)})) is not None:
            # Convert ObjectId to string and add default values
            catch["_id"] = str(catch["_id"])
            catch.setdefault('date', None)
            catch.setdefault('lake', None)
            return CatchResponse(**catch)
        raise HTTPException(status_code=404, detail=f"Catch {catch_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.put("/catches/{catch_id}", response_model=CatchResponse)
async def update_catch(catch_id: str, catch_update: CatchCreate):
    try:
        update_data = catch_update.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        result = await catches_collection.update_one(
            {"_id": ObjectId(catch_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail=f"Catch {catch_id} not found or no changes made")
        
        updated_catch = await catches_collection.find_one({"_id": ObjectId(catch_id)})
        if updated_catch:
            updated_catch["_id"] = str(updated_catch["_id"])
            updated_catch.setdefault('date', None)
            updated_catch.setdefault('lake', None)
            return CatchResponse(**updated_catch)
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated document")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.delete("/catches/{catch_id}")
async def delete_catch(catch_id: str):
    try:
        result = await catches_collection.delete_one({"_id": ObjectId(catch_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Catch {catch_id} not found")
        
        return {"message": f"Catch {catch_id} deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --- Bulk Upload Endpoints ---
@app.get("/catches/template/csv")
async def download_csv_template():
    """Download a CSV template for bulk upload"""
    try:
        # Create sample data for the template
        sample_data = [
            {
                "date": "2024-01-15",
                "time": "14:30:00",
                "location": "24°50'42\"S 29°26'16\"E",
                "lake": "Hartbeespoort",
                "structure": "Rocky Point",
                "water_temp": "22.5",
                "water_quality": "Clear",
                "line_type": "Braid",
                "boat_depth": "25.5",
                "bait_depth": "18.0",
                "bait": "Senko",
                "bait_type": "Soft Plastic",
                "bait_colour": "Green Pumpkin",
                "scented": "true",
                "fish_weight": "2.5",
                "comments": "Caught on a slow retrieve"
            }
        ]
        
        # Create CSV content
        output = io.StringIO()
        if sample_data:
            fieldnames = list(sample_data[0].keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(sample_data)
        
        # Return as downloadable file
        response = StreamingResponse(
            iter([output.getvalue()]), 
            media_type="text/csv"
        )
        response.headers["Content-Disposition"] = "attachment; filename=bite-tracker-template.csv"
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")

@app.get("/catches/template/json")
async def download_json_template():
    """Download a JSON template for bulk upload"""
    try:
        # Create sample data for the template
        sample_data = [
            {
                "date": "2024-01-15",
                "time": "14:30:00",
                "location": "24°50'42\"S 29°26'16\"E",
                "lake": "Hartbeespoort",
                "structure": "Rocky Point",
                "water_temp": 22.5,
                "water_quality": "Clear",
                "line_type": "Braid",
                "boat_depth": 25.5,
                "bait_depth": 18.0,
                "bait": "Senko",
                "bait_type": "Soft Plastic",
                "bait_colour": "Green Pumpkin",
                "scented": True,
                "fish_weight": 2.5,
                "comments": "Caught on a slow retrieve"
            }
        ]
        
        # Return as downloadable file
        return JSONResponse(
            content=sample_data,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=bite-tracker-template.json"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")

@app.post("/catches/bulk", response_model=BulkUploadResponse)
async def bulk_upload_catches(file: UploadFile = File(...)):
    """Upload multiple catches via CSV or JSON file"""
    try:
        # Check file type
        if file.filename.endswith('.csv'):
            contents = await file.read()
            decoded = contents.decode('utf-8')
            csv_reader = csv.DictReader(decoded.splitlines())
            catches = list(csv_reader)
        elif file.filename.endswith('.json'):
            contents = await file.read()
            catches = json.loads(contents)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please use CSV or JSON.")
        
        # Process and validate each catch
        success_count = 0
        errors = []
        
        for i, catch_data in enumerate(catches):
            try:
                # Validate and transform data
                validated_data = validate_catch_data(catch_data)
                
                # Save to MongoDB
                result = await catches_collection.insert_one(validated_data)
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {i+1}: {str(e)}")
        
        return BulkUploadResponse(
            success=True,
            message=f"Successfully processed {success_count} catches",
            details={
                "successCount": success_count,
                "errorCount": len(errors),
                "errors": errors
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk upload error: {str(e)}")

def validate_catch_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and transform catch data from bulk upload"""
    validated = {}
    
    # Required fields validation
    required_fields = ['time', 'location', 'structure', 'water_temp', 
                      'water_quality', 'line_type', 'boat_depth', 
                      'bait_depth', 'bait', 'bait_type', 'bait_colour', 
                      'scented', 'fish_weight']
    
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == '':
            raise ValueError(f"Missing required field: {field}")
    
    # Type conversion and validation
    try:
        # Convert numeric fields
        numeric_fields = ['water_temp', 'boat_depth', 'bait_depth', 'fish_weight']
        for field in numeric_fields:
            if field in data:
                validated[field] = float(data[field])
        
        # Convert boolean field
        if 'scented' in data:
            scented_val = str(data['scented']).lower()
            if scented_val in ['true', 'yes', '1', 'y']:
                validated['scented'] = True
            elif scented_val in ['false', 'no', '0', 'n']:
                validated['scented'] = False
            else:
                raise ValueError(f"Invalid value for scented: {data['scented']}")
        
        # Copy other fields
        string_fields = ['date', 'time', 'location', 'lake', 'structure', 
                        'water_quality', 'line_type', 'bait', 'bait_type', 
                        'bait_colour', 'comments']
        
        for field in string_fields:
            if field in data and data[field] is not None:
                validated[field] = str(data[field]).strip()
                
    except (ValueError, TypeError) as e:
        raise ValueError(f"Data type conversion error: {str(e)}")
    
    return validated

# --- Existing analysis and utility endpoints (unchanged) ---
@app.post("/analyze/")
async def analyze_data(request: AnalysisRequest):
    try:
        catches = []
        async for document in catches_collection.find():
            document.pop('_id', None)
            catches.append(document)
        
        if not catches:
            return {"message": "No data available for analysis."}
        
        df = pd.DataFrame(catches)
        
        numeric_columns = ['water_temp', 'boat_depth', 'bait_depth', 'fish_weight']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        if request.analysis_type == "bait_success":
            analysis_result = df.groupby('bait_type').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('total_weight', ascending=False)
            return analysis_result.to_dict(orient='index')
        
        elif request.analysis_type == "time_analysis":
            df['hour'] = pd.to_datetime(df['time'], format='%H:%M:%S').dt.hour
            analysis_result = df.groupby('hour').agg(
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            )
            return analysis_result.to_dict(orient='index')
        
        elif request.analysis_type == "structure_analysis":
            analysis_result = df.groupby('structure').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('total_weight', ascending=False)
            return analysis_result.to_dict(orient='index')
        
        elif request.analysis_type == "lake_analysis":
            analysis_result = df.groupby('lake').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('total_weight', ascending=False)
            return analysis_result.to_dict(orient='index')
        
        elif request.analysis_type == "date_analysis":
            df['date'] = pd.to_datetime(df['date'])
            analysis_result = df.groupby('date').agg(
                total_weight=('fish_weight', 'sum'),
                count=('fish_weight', 'count')
            ).sort_values('date')
            analysis_result.index = analysis_result.index.strftime('%Y-%m-%d')
            return analysis_result.to_dict(orient='index')
        
        elif request.analysis_type == "bait_depth_analysis":
            if request.parameter:
                df_filtered = df[df['bait'] == request.parameter]
            else:
                df_filtered = df
            
            analysis_result = df_filtered.groupby('bait_depth').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('bait_depth')
            return analysis_result.to_dict(orient='index')
        
        elif request.analysis_type == "water_temp_analysis":
            analysis_result = df.groupby(pd.cut(df['water_temp'], bins=5)).agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            )
            analysis_result.index = analysis_result.index.astype(str)
            return analysis_result.to_dict(orient='index')
        
        else:
            raise HTTPException(status_code=400, detail="Unknown analysis type")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.post("/sample-data/")
async def create_sample_data():
    try:
        sample_catches = [
            {
                "date": "2024-01-15",
                "time": "07:30:00",
                "location": "24°50'42\"S 29°26'16\"E",
                "lake": "Lake Serene",
                "structure": "Weeds",
                "water_temp": 22.0,
                "water_quality": "Clear",
                "line_type": "Braid",
                "boat_depth": 10.0,
                "bait_depth": 2.0,
                "bait": "Senko",
                "bait_type": "Soft",
                "bait_colour": "Green Pumpkin",
                "scented": False,
                "fish_weight": 1.5,
                "comments": "Good Fight"
            },
            {
                "date": "2024-01-16",
                "time": "14:20:00",
                "location": "24°51'12\"S 29°25'45\"E",
                "lake": "Lake Serene",
                "structure": "Rock Pile",
                "water_temp": 24.5,
                "water_quality": "Stained",
                "line_type": "Fluorocarbon",
                "boat_depth": 15.0,
                "bait_depth": 8.0,
                "bait": "Jig",
                "bait_type": "Jig",
                "bait_colour": "Black/Blue",
                "scented": True,
                "fish_weight": 2.8,
                "comments": "Big one!"
            },
            {
                "date": "2024-01-17",
                "time": "09:45:00",
                "location": "24°49'30\"S 29°27'10\"E",
                "lake": "Lake Clearwater",
                "structure": "Drop Off",
                "water_temp": 21.0,
                "water_quality": "Clear",
                "line_type": "Braid",
                "boat_depth": 20.0,
                "bait_depth": 5.0,
                "bait": "Crankbait",
                "bait_type": "Hard",
                "bait_colour": "Chartreuse",
                "scented": False,
                "fish_weight": 1.2,
                "comments": "Multiple follows"
            }
        ]
        
        # Clear existing data first
        await catches_collection.delete_many({})
        
        result = await catches_collection.insert_many(sample_catches)
        return {
            "message": f"Inserted {len(result.inserted_ids)} sample records", 
            "inserted_ids": [str(id) for id in result.inserted_ids]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sample data error: {str(e)}")

@app.delete("/clear-data/")
async def clear_all_data():
    try:
        result = await catches_collection.delete_many({})
        return {"message": f"Deleted {result.deleted_count} records"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear data error: {str(e)}")