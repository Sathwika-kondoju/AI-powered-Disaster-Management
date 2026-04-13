import sys
import os
from pathlib import Path

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import jwt
from passlib.context import CryptContext
import requests
import logging

# JWT Configuration
SECRET_KEY = "disaster_mgmt_secret_key_2024"
ALGORITHM = "HS256"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'disaster_db')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password: str
    full_name: str
    phone: str = ""
    location: Dict = Field(default_factory=lambda: {"city": "", "state": "", "latitude": 0.0, "longitude": 0.0})
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    phone: str = ""
    city: str = ""
    state: str = ""

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    phone: str
    location: Dict
    
class Token(BaseModel):
    access_token: str
    token_type: str

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ML Prediction Input Models
class FloodPredictionInput(BaseModel):
    precipitation: float
    humidity: float
    terrain_elevation: float
    historical_flood_risk: float
    visibility: float
    temperature: float
    wind_speed: float

class EarthquakePredictionInput(BaseModel):
    seismic_activity: float
    pressure: float
    temperature: float
    humidity: float
    wind_speed: float
    cloud_cover: float
    precipitation: float
    visibility: float
    terrain_elevation: float

class CyclonePredictionInput(BaseModel):
    sea_surface_temp: float
    wind_speed: float
    humidity: float
    pressure: float
    ocean_heat_content: float

# Try to import ML models, but handle if not available
try:
    from models.prediction_service import get_prediction_service
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: ML models not available. Predictions will use mock data.")


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# ==================== AUTH ROUTES ====================
@api_router.post("/register")
async def register_user(user: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        return {"error": "Username or email already exists"}
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user object
    user_obj = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        location={"city": user.city, "state": user.state, "latitude": 0.0, "longitude": 0.0}
    )
    
    # Save to database
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "User registered successfully", "user_id": user_obj.id}

@api_router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return token"""
    # Find user
    user = await db.users.find_one({"username": form_data.username})
    if not user:
        return {"error": "Invalid credentials"}
    
    # Verify password
    if not verify_password(form_data.password, user['password']):
        return {"error": "Invalid credentials"}
    
    # Create token
    access_token = create_access_token(data={"sub": user['username'], "user_id": user['id']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "full_name": user['full_name'],
            "location": user['location']
        }
    }

@api_router.get("/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user info"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        user = await db.users.find_one({"username": username})
        if not user:
            return {"error": "User not found"}
        return {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "full_name": user['full_name'],
            "phone": user.get('phone', ''),
            "location": user['location']
        }
    except Exception as e:
        return {"error": str(e)}

# ==================== STATUS ROUTES ====================
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ==================== ML PREDICTION ROUTES ====================
@api_router.post("/predict/flood")
async def predict_flood(input_data: FloodPredictionInput):
    """Predict flood probability using Random Forest"""
    if ML_AVAILABLE:
        try:
            service = get_prediction_service()
            features = input_data.model_dump()
            probability, confidence = service.predict_flood(features)
            risk_level = service.get_risk_level(probability)
            
            return {
                "disaster_type": "flood",
                "probability": probability,
                "confidence": confidence,
                "risk_level": risk_level,
                "model_type": "Random Forest",
                "model_accuracy": "83.13%"
            }
        except Exception as e:
            return {"error": str(e), "fallback": True}
    else:
        # Return mock prediction
        import random
        prob = random.uniform(0.3, 0.8)
        return {
            "disaster_type": "flood",
            "probability": prob,
            "confidence": 0.85,
            "risk_level": "high" if prob > 0.6 else "medium",
            "model_type": "Random Forest (Mock)",
            "fallback": True
        }


@api_router.post("/predict/earthquake")
async def predict_earthquake(input_data: EarthquakePredictionInput):
    """Predict earthquake probability using Neural Network"""
    if ML_AVAILABLE:
        try:
            service = get_prediction_service()
            features = input_data.model_dump()
            probability, confidence = service.predict_earthquake(features)
            risk_level = service.get_risk_level(probability)
            
            return {
                "disaster_type": "earthquake",
                "probability": probability,
                "confidence": confidence,
                "risk_level": risk_level,
                "model_type": "Neural Network (MLP)",
                "model_accuracy": "94.00%"
            }
        except Exception as e:
            return {"error": str(e), "fallback": True}
    else:
        import random
        prob = random.uniform(0.1, 0.4)
        return {
            "disaster_type": "earthquake",
            "probability": prob,
            "confidence": 0.90,
            "risk_level": "low",
            "model_type": "Neural Network (Mock)",
            "fallback": True
        }


@api_router.post("/predict/cyclone")
async def predict_cyclone(input_data: CyclonePredictionInput):
    """Predict cyclone probability using Time Series (ARIMA)"""
    if ML_AVAILABLE:
        try:
            service = get_prediction_service()
            features = input_data.model_dump()
            probability, confidence = service.predict_cyclone(features)
            risk_level = service.get_risk_level(probability)
            
            return {
                "disaster_type": "cyclone",
                "probability": probability,
                "confidence": confidence,
                "risk_level": risk_level,
                "model_type": "Time Series (ARIMA)",
                "model_accuracy": "69.59%"
            }
        except Exception as e:
            return {"error": str(e), "fallback": True}
    else:
        import random
        prob = random.uniform(0.2, 0.5)
        return {
            "disaster_type": "cyclone",
            "probability": prob,
            "confidence": 0.75,
            "risk_level": "medium",
            "model_type": "Time Series (Mock)",
            "fallback": True
        }


@api_router.post("/predict/all")
async def predict_all(
    flood: Optional[FloodPredictionInput] = None,
    earthquake: Optional[EarthquakePredictionInput] = None,
    cyclone: Optional[CyclonePredictionInput] = None
):
    """Get predictions for all disaster types"""
    results = {}
    
    if flood:
        try:
            if ML_AVAILABLE:
                service = get_prediction_service()
                prob, conf = service.predict_flood(flood.model_dump())
                results["flood"] = {"probability": prob, "confidence": conf, "risk_level": service.get_risk_level(prob)}
            else:
                import random
                prob = random.uniform(0.3, 0.8)
                results["flood"] = {"probability": prob, "confidence": 0.85, "risk_level": "high"}
        except Exception as e:
            results["flood"] = {"error": str(e)}
    
    if earthquake:
        try:
            if ML_AVAILABLE:
                service = get_prediction_service()
                prob, conf = service.predict_earthquake(earthquake.model_dump())
                results["earthquake"] = {"probability": prob, "confidence": conf, "risk_level": service.get_risk_level(prob)}
            else:
                import random
                prob = random.uniform(0.1, 0.4)
                results["earthquake"] = {"probability": prob, "confidence": 0.90, "risk_level": "low"}
        except Exception as e:
            results["earthquake"] = {"error": str(e)}
    
    if cyclone:
        try:
            if ML_AVAILABLE:
                service = get_prediction_service()
                prob, conf = service.predict_cyclone(cyclone.model_dump())
                results["cyclone"] = {"probability": prob, "confidence": conf, "risk_level": service.get_risk_level(prob)}
            else:
                import random
                prob = random.uniform(0.2, 0.5)
                results["cyclone"] = {"probability": prob, "confidence": 0.75, "risk_level": "medium"}
        except Exception as e:
            results["cyclone"] = {"error": str(e)}
    
    return results


@api_router.get("/models/status")
async def get_models_status():
    """Check status of ML models"""
    status = {
        "ml_available": ML_AVAILABLE,
        "models": {}
    }
    
    if ML_AVAILABLE:
        try:
            service = get_prediction_service()
            status["models"] = service.get_all_model_status()
        except Exception as e:
            status["error"] = str(e)
    
    return status


# ==================== WEATHER ROUTES ====================
@api_router.get("/weather/forecast")
async def get_weather_forecast(latitude: float, longitude: float):
    """Get 5-day weather forecast"""
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,wind_speed_max",
            "timezone": "auto",
            "forecast_days": 5
        }
        response = requests.get(url, params=params)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

@api_router.get("/weather/current")
async def get_current_weather(latitude: float, longitude: float):
    """Get current weather"""
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure",
            "timezone": "auto"
        }
        response = requests.get(url, params=params)
        return response.json()
    except Exception as e:
        return {"error": str(e)}


# ==================== USER LOCATION ROUTE ====================
@api_router.put("/user/location")
async def update_user_location(
    token: str = Depends(oauth2_scheme), 
    latitude: float = 0.0, 
    longitude: float = 0.0, 
    city: str = "", 
    state: str = ""
):
    """Update user location"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        await db.users.update_one(
            {"username": username},
            {"$set": {"location": {"city": city, "state": state, "latitude": latitude, "longitude": longitude}}}
        )
        return {"message": "Location updated successfully"}
    except Exception as e:
        return {"error": str(e)}


# ==================== HISTORICAL DATA ROUTE ====================
@api_router.get("/disasters/history")
async def get_disaster_history(location: str = ""):
    """Get historical disaster data"""
    return {
        "flood": [
            {"date": "2024-06-15", "severity": "high", "location": location or "Mumbai"},
            {"date": "2024-07-20", "severity": "medium", "location": location or "Mumbai"},
            {"date": "2024-08-10", "severity": "low", "location": location or "Mumbai"}
        ],
        "cyclone": [
            {"date": "2024-05-01", "severity": "high", "location": location or "Chennai"},
            {"date": "2024-10-15", "severity": "medium", "location": location or "Chennai"}
        ],
        "earthquake": [
            {"date": "2024-03-15", "severity": "low", "location": location or "Delhi"},
            {"date": "2024-09-22", "severity": "low", "location": location or "Delhi"}
        ]
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

