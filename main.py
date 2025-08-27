from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List, Dict, Any
from datetime import time, datetime, timedelta
import pandas as pd
from bson import ObjectId
from bson import json_util
import json
import csv
import io
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
env_file = '.env.local' if os.path.exists('.env.local') else '.env'
load_dotenv(env_file)
print(f"✅ Loaded environment from: {env_file}")

# Security configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token security
security = HTTPBearer()

# --- Authentication Models ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = Field(None, max_length=100)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    is_active: bool = True
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

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
    line_weight: Optional[float] = Field(None, example=12.0)  # Line weight in pounds
    weight_pegged: Optional[bool] = Field(None, example=True)  # Weight pegged - tick/no tick
    hook_size: Optional[str] = Field(None, example="2/0")  # Hook and size
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
    line_weight: Optional[float] = Field(None, example=12.0)  # Line weight in pounds
    weight_pegged: Optional[bool] = Field(None, example=True)  # Weight pegged - tick/no tick
    hook_size: Optional[str] = Field(None, example="2/0")  # Hook and size
    comments: Optional[str] = Field(None, example="Good Fight")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

# Model for requesting analysis
class AnalysisRequest(BaseModel):
    analysis_type: str = Field(..., example="bait_success")
    parameter: Optional[str] = Field(None, example="Spinner Bait")

# Model for advanced analysis
class AdvancedAnalysisRequest(BaseModel):
    success_metric: str = Field("total_weight")
    group_by: List[str] = Field(..., example=["bait", "time_of_day"])
    filters: Optional[Dict[str, Any]] = None
    limit: Optional[int] = Field(10)

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
users_collection = db.users

# --- Authentication Helper Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    return user

# Get the frontend URL from environment variable, with localhost as fallback
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
VERCEL_URL = os.environ.get("VERCEL_URL", "")  # Vercel will provide this

# Create a list of allowed origins
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000", 
    "http://localhost:3001",
]

# Add Vercel URL if it exists
if VERCEL_URL:
    allowed_origins.append(f"https://{VERCEL_URL}")
    allowed_origins.append(VERCEL_URL)

# Also allow any Vercel preview deployments
allowed_origins.append("https://*.vercel.app")
allowed_origins.append("https://*.vercel.app/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
        print(f"✅ Allowed CORS origins: {allowed_origins}")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print(f"❌ Connection string used: {MONGO_URL}")

@app.get("/")
async def root():
    return {"message": "Welcome to the BiteTracker API! Check /docs for documentation."}

# --- Authentication Endpoints ---
@app.post("/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    try:
        # Check if username already exists
        existing_user = await users_collection.find_one({"username": user.username})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        existing_email = await users_collection.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        user_data = {
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = await users_collection.insert_one(user_data)
        created_user = await users_collection.find_one({"_id": result.inserted_id})
        
        if created_user:
            created_user["_id"] = str(created_user["_id"])
            return UserResponse(**created_user)
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@app.post("/auth/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    try:
        # Find user by username
        user = await users_collection.find_one({"username": user_credentials.username})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"]}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    try:
        current_user["_id"] = str(current_user["_id"])
        return UserResponse(**current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user info: {str(e)}")

@app.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    full_name: Optional[str] = Form(None),
    email: Optional[EmailStr] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        update_data = {}
        if full_name is not None:
            update_data["full_name"] = full_name
        if email is not None:
            # Check if email is already taken by another user
            existing_email = await users_collection.find_one({
                "email": email,
                "_id": {"$ne": current_user["_id"]}
            })
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            update_data["email"] = email
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        result = await users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found or no changes made")
        
        updated_user = await users_collection.find_one({"_id": current_user["_id"]})
        if updated_user:
            updated_user["_id"] = str(updated_user["_id"])
            return UserResponse(**updated_user)
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated user")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update error: {str(e)}")

@app.post("/auth/change-password")
async def change_password(
    current_password: str = Form(...),
    new_password: str = Form(..., min_length=6),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Verify current password
        if not verify_password(current_password, current_user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_hashed_password = get_password_hash(new_password)
        
        # Update password
        result = await users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"hashed_password": new_hashed_password}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update password")
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password change error: {str(e)}")

# --- Updated endpoints with string ID handling ---
@app.post("/catches/", response_model=CatchResponse)
async def create_catch(catch: CatchCreate, current_user: dict = Depends(get_current_user)):
    try:
        catch_dict = catch.model_dump()
        catch_dict["user_id"] = str(current_user["_id"])
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
async def get_all_catches(current_user: dict = Depends(get_current_user)):
    try:
        catches = []
        async for document in catches_collection.find({"user_id": str(current_user["_id"])}):
            # Convert ObjectId to string and add default values
            document["_id"] = str(document["_id"])
            document.setdefault('date', None)
            document.setdefault('lake', None)
            catches.append(CatchResponse(**document))
        return catches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/catches/{catch_id}", response_model=CatchResponse)
async def get_catch(catch_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if (catch := await catches_collection.find_one({
            "_id": ObjectId(catch_id),
            "user_id": str(current_user["_id"])
        })) is not None:
            # Convert ObjectId to string and add default values
            catch["_id"] = str(catch["_id"])
            catch.setdefault('date', None)
            catch.setdefault('lake', None)
            return CatchResponse(**catch)
        raise HTTPException(status_code=404, detail=f"Catch {catch_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.put("/catches/{catch_id}", response_model=CatchResponse)
async def update_catch(catch_id: str, catch_update: CatchCreate, current_user: dict = Depends(get_current_user)):
    try:
        update_data = catch_update.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        result = await catches_collection.update_one(
            {"_id": ObjectId(catch_id), "user_id": str(current_user["_id"])},
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
async def delete_catch(catch_id: str, current_user: dict = Depends(get_current_user)):
    try:
        result = await catches_collection.delete_one({
            "_id": ObjectId(catch_id),
            "user_id": str(current_user["_id"])
        })
        
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
        
        # Create CSV content with proper UTF-8 encoding
        output = io.StringIO()
        if sample_data:
            fieldnames = list(sample_data[0].keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(sample_data)
        
        # Return as downloadable file with UTF-8 encoding
        csv_content = output.getvalue()
        response = StreamingResponse(
            iter([csv_content.encode('utf-8')]), 
            media_type="text/csv; charset=utf-8"
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
async def bulk_upload_catches(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload multiple catches via CSV or JSON file"""
    try:
        print(f"Received file: {file.filename}, size: {file.size}")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if file.size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Check file type
        if file.filename.endswith('.csv'):
            contents = await file.read()
            
            # Try different encodings to handle special characters
            encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
            decoded = None
            
            for encoding in encodings:
                try:
                    decoded = contents.decode(encoding)
                    print(f"Successfully decoded with {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
            
            if decoded is None:
                raise HTTPException(status_code=400, detail="Unable to decode CSV file. Please ensure it's saved with UTF-8 encoding.")
            
            print(f"CSV content length: {len(decoded)}")
            print(f"CSV content: {decoded[:200]}...")  # Print first 200 chars
            csv_reader = csv.DictReader(decoded.splitlines())
            catches = list(csv_reader)
            print(f"Parsed {len(catches)} catches from CSV")
            if catches:
                print(f"First catch data: {catches[0]}")
                print(f"CSV fieldnames: {csv_reader.fieldnames}")
        elif file.filename.endswith('.json'):
            contents = await file.read()
            catches = json.loads(contents)
            print(f"Parsed {len(catches)} catches from JSON")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please use CSV or JSON.")
        
        if not catches:
            raise HTTPException(status_code=400, detail="No data found in file")
        
        print(f"Current user: {current_user}")
        print(f"User ID: {current_user['_id']}")
        
        # Process and validate each catch
        success_count = 0
        errors = []
        
        for i, catch_data in enumerate(catches):
            try:
                print(f"Processing row {i+1}: {catch_data}")
                # Validate and transform data
                validated_data = validate_catch_data(catch_data)
                
                # Add user_id to the data
                validated_data["user_id"] = str(current_user["_id"])
                
                # Save to MongoDB
                result = await catches_collection.insert_one(validated_data)
                success_count += 1
                
            except Exception as e:
                error_msg = f"Row {i+1}: {str(e)}"
                print(f"Error processing row {i+1}: {e}")
                errors.append(error_msg)
        
        return BulkUploadResponse(
            success=True,
            message=f"Successfully processed {success_count} catches",
            details={
                "successCount": success_count,
                "errorCount": len(errors),
                "errors": errors
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Bulk upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Bulk upload error: {str(e)}")

def validate_catch_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and transform catch data from bulk upload"""
    print(f"Validating data: {data}")
    validated = {}
    
    # Required fields validation
    required_fields = ['time', 'location', 'structure', 'water_temp', 
                      'water_quality', 'line_type', 'boat_depth', 
                      'bait_depth', 'bait', 'bait_type', 'bait_colour', 
                      'scented', 'fish_weight']
    
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == '':
            print(f"Missing required field: {field}")
            raise ValueError(f"Missing required field: {field}")
    
    # Type conversion and validation
    try:
        # Convert numeric fields
        numeric_fields = ['water_temp', 'boat_depth', 'bait_depth', 'fish_weight']
        for field in numeric_fields:
            if field in data:
                validated[field] = float(data[field])
                print(f"Converted {field}: {data[field]} -> {validated[field]}")
        
        # Convert boolean fields
        boolean_fields = ['scented', 'weight_pegged']
        for field in boolean_fields:
            if field in data:
                field_val = str(data[field]).lower()
                if field_val in ['true', 'yes', '1', 'y']:
                    validated[field] = True
                elif field_val in ['false', 'no', '0', 'n']:
                    validated[field] = False
                else:
                    raise ValueError(f"Invalid value for {field}: {data[field]}")
                print(f"Converted {field}: {data[field]} -> {validated[field]}")
        
        # Convert optional numeric fields
        optional_numeric_fields = ['line_weight']
        for field in optional_numeric_fields:
            if field in data and data[field] is not None and str(data[field]).strip() != '':
                validated[field] = float(data[field])
                print(f"Converted {field}: {data[field]} -> {validated[field]}")
        
        # Copy other fields
        string_fields = ['date', 'time', 'location', 'lake', 'structure', 
                        'water_quality', 'line_type', 'bait', 'bait_type', 
                        'bait_colour', 'hook_size', 'comments']
        
        for field in string_fields:
            if field in data and data[field] is not None:
                validated[field] = str(data[field]).strip()
                print(f"Copied {field}: {data[field]} -> {validated[field]}")
                
    except (ValueError, TypeError) as e:
        print(f"Data type conversion error: {str(e)}")
        raise ValueError(f"Data type conversion error: {str(e)}")
    
    print(f"Validation successful: {validated}")
    return validated

# --- Existing analysis and utility endpoints (unchanged) ---
@app.post("/analyze/")
async def analyze_data(request: AnalysisRequest, current_user: dict = Depends(get_current_user)):
    try:
        catches = []
        async for document in catches_collection.find({"user_id": str(current_user["_id"])}):
            document.pop('_id', None)
            catches.append(document)
        
        if not catches:
            return {"message": "No data available for analysis."}
        
        df = pd.DataFrame(catches)
        
        numeric_columns = ['water_temp', 'boat_depth', 'bait_depth', 'fish_weight', 'line_weight']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                # Replace infinite values with NaN
                df[col] = df[col].replace([float('inf'), float('-inf')], float('nan'))
        
        if request.analysis_type == "bait_success":
            analysis_result = df.groupby('bait_type').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('total_weight', ascending=False)
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
        elif request.analysis_type == "time_analysis":
            # Handle both HH:MM and HH:MM:SS formats
            def parse_time(time_str):
                try:
                    # Try HH:MM:SS format first
                    return pd.to_datetime(time_str, format='%H:%M:%S')
                except ValueError:
                    try:
                        # Try HH:MM format
                        return pd.to_datetime(time_str, format='%H:%M')
                    except ValueError:
                        # Try mixed format
                        return pd.to_datetime(time_str, format='mixed')
            
            df['hour'] = df['time'].apply(parse_time).dt.hour
            analysis_result = df.groupby('hour').agg(
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            )
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
        elif request.analysis_type == "structure_analysis":
            analysis_result = df.groupby('structure').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('total_weight', ascending=False)
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
        elif request.analysis_type == "lake_analysis":
            analysis_result = df.groupby('lake').agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            ).sort_values('total_weight', ascending=False)
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
        elif request.analysis_type == "date_analysis":
            df['date'] = pd.to_datetime(df['date'])
            analysis_result = df.groupby('date').agg(
                total_weight=('fish_weight', 'sum'),
                count=('fish_weight', 'count')
            ).sort_values('date')
            analysis_result.index = analysis_result.index.strftime('%Y-%m-%d')
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
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
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
        elif request.analysis_type == "water_temp_analysis":
            # Filter out invalid water temperatures
            valid_temp_df = df[df['water_temp'].notna() & (df['water_temp'] != float('inf')) & (df['water_temp'] != float('-inf'))]
            
            if len(valid_temp_df) == 0:
                return {"message": "No valid water temperature data available for analysis."}
            
            # Create bins with proper bounds
            min_temp = valid_temp_df['water_temp'].min()
            max_temp = valid_temp_df['water_temp'].max()
            
            if min_temp == max_temp:
                # If all temperatures are the same, create a single bin
                bins = [min_temp - 1, max_temp + 1]
            else:
                # Create 5 bins with proper bounds
                bin_width = (max_temp - min_temp) / 5
                bins = [min_temp + i * bin_width for i in range(6)]
            
            analysis_result = valid_temp_df.groupby(pd.cut(valid_temp_df['water_temp'], bins=bins, include_lowest=True)).agg(
                total_weight=('fish_weight', 'sum'),
                average_weight=('fish_weight', 'mean'),
                count=('fish_weight', 'count')
            )
            
            # Convert index to string and handle any remaining infinite values
            analysis_result.index = analysis_result.index.astype(str)
            
            result_dict = analysis_result.to_dict(orient='index')
            return clean_for_json(result_dict)
        
        else:
            raise HTTPException(status_code=400, detail="Unknown analysis type")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

# --- Advanced Analysis Endpoint ---
@app.post("/analyze/advanced/")
async def advanced_analysis(request: AdvancedAnalysisRequest, current_user: dict = Depends(get_current_user)):
    try:
        match_stage = {"user_id": str(current_user["_id"])}
        if request.filters:
            for field, value in request.filters.items():
                match_stage[field] = {"$in": value} if isinstance(value, list) else value
        
        project_stage = {
            "bait": 1, "bait_type": 1, "bait_colour": 1, "time": 1, "location": 1, "lake": 1,
            "structure": 1, "water_temp": {"$toDouble": "$water_temp"},
            "water_quality": 1, "line_type": 1, "boat_depth": {"$toDouble": "$boat_depth"}, 
            "bait_depth": {"$toDouble": "$bait_depth"}, "fish_weight": {"$toDouble": "$fish_weight"},
            "scented": 1, "line_weight": {"$toDouble": "$line_weight"}, 
            "weight_pegged": 1, "hook_size": 1
        }
        
        if "time_of_day" in request.group_by:
            project_stage["time_of_day"] = {
                "$switch": {
                    "branches": [
                        {"case": {"$lt": [{"$hour": {"$toDate": "$time"}}, 6]}, "then": "Night (0-6)"},
                        {"case": {"$lt": [{"$hour": {"$toDate": "$time"}}, 12]}, "then": "Morning (6-12)"},
                        {"case": {"$lt": [{"$hour": {"$toDate": "$time"}}, 18]}, "then": "Afternoon (12-18)"},
                        {"case": {"$lte": [{"$hour": {"$toDate": "$time"}}, 23]}, "then": "Evening (18-24)"}
                    ],
                    "default": "Unknown"
                }
            }
        
        group_fields = {field: f"${field}" for field in request.group_by}
        group_stage = {
            "_id": group_fields,
            "total_weight": {"$sum": "$fish_weight"},
            "average_weight": {"$avg": "$fish_weight"},
            "count": {"$sum": 1}
        }
        
        sort_field = "count" if request.success_metric == "count" else "total_weight"
        sort_stage = {sort_field: -1}
        
        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})
        
        pipeline.extend([
            {"$project": project_stage},
            {"$match": {"fish_weight": {"$gt": 0}}},
            {"$group": group_stage},
            {"$sort": sort_stage},
            {"$limit": request.limit}
        ])
        
        results = await catches_collection.aggregate(pipeline).to_list(length=request.limit)
        
        formatted_results = []
        for result in results:
            formatted_result = {
                **result["_id"],
                "total_weight": round(result["total_weight"], 2),
                "average_weight": round(result["average_weight"], 2),
                "count": result["count"]
            }
            formatted_results.append(formatted_result)
        
        return {
            "analysis": formatted_results,
            "summary": {
                "total_combinations": len(formatted_results),
                "success_metric": request.success_metric
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced analysis error: {str(e)}")

# --- Field Options Endpoint ---
@app.get("/catches/options/{field_name}")
async def get_field_options(field_name: str, search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    try:
        pipeline = [
            {"$match": {"user_id": str(current_user["_id"]), field_name: {"$exists": True, "$ne": None}}},
            {"$group": {"_id": f"${field_name}"}},
            {"$sort": {"_id": 1}},
            {"$limit": 50}
        ]
        
        if search:
            pipeline.insert(1, {"$match": {field_name: {"$regex": search, "$options": "i"}}})
        
        results = await catches_collection.aggregate(pipeline).to_list(length=50)
        options = [result["_id"] for result in results if result["_id"] not in [None, ""]]
        
        return {"field": field_name, "options": options}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error getting options: {str(e)}")

# --- Statistics Endpoint ---
@app.get("/catches/stats/overview")
async def get_stats_overview(current_user: dict = Depends(get_current_user)):
    try:
        pipeline = [
            {"$match": {"user_id": str(current_user["_id"]), "fish_weight": {"$exists": True, "$gt": 0}}},
            {"$group": {
                "_id": None,
                "total_catches": {"$sum": 1},
                "total_weight": {"$sum": "$fish_weight"},
                "avg_weight": {"$avg": "$fish_weight"},
                "max_weight": {"$max": "$fish_weight"},
                "unique_lakes": {"$addToSet": "$lake"},
                "unique_baits": {"$addToSet": "$bait"}
            }},
            {"$project": {
                "total_catches": 1,
                "total_weight": {"$round": ["$total_weight", 2]},
                "average_weight": {"$round": ["$avg_weight", 2]},
                "max_weight": {"$round": ["$max_weight", 2]},
                "lake_count": {"$size": "$unique_lakes"},
                "bait_count": {"$size": "$unique_baits"}
            }}
        ]
        
        results = await catches_collection.aggregate(pipeline).to_list(length=1)
        return results[0] if results else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

def clean_for_json(data):
    """Clean data for JSON serialization by replacing infinite values and NaN"""
    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            if isinstance(value, dict):
                cleaned[key] = clean_for_json(value)
            elif isinstance(value, (int, float)):
                if pd.isna(value) or value == float('inf') or value == float('-inf'):
                    cleaned[key] = None
                else:
                    cleaned[key] = value
            else:
                cleaned[key] = value
        return cleaned
    return data

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
                "line_weight": 12.0,
                "weight_pegged": True,
                "hook_size": "2/0",
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