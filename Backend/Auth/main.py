from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Google SSO API")

# CORS — allow your React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID = "944851307431-lbrke4j7c5cfgsp73j60ejhna4t8cs31.apps.googleusercontent.com"
JWT_SECRET       = "my-secret-key"
JWT_ALGORITHM    = "HS256"
JWT_EXPIRE_HOURS = 24

security = HTTPBearer()

# ── Schemas ───────────────────────────────────────────────────────────────────
class GoogleTokenRequest(BaseModel):
    credential: str          # ID token returned by Google One Tap / OAuth popup

class UserResponse(BaseModel):
    id: str 
    email: str
    name: str
    picture: str
    access_token: str

class MeResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str

# ── Helpers ───────────────────────────────────────────────────────────────────
def create_jwt(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/auth/google", response_model=UserResponse)
async def google_auth(body: GoogleTokenRequest):
    """
    Verify the Google ID token sent from the frontend.
    On success, return a signed JWT the client can use for subsequent requests.
    """
    try:
        info = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )  
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {exc}")

    user_payload = {
        "sub":     info["sub"],
        "email":   info["email"],
        "name":    info.get("name", ""),
        "picture": info.get("picture", ""),
    }

    access_token = create_jwt(user_payload)

    return UserResponse(
        id=info["sub"],
        email=info["email"],
        name=info.get("name", ""),
        picture=info.get("picture", ""),
        access_token=access_token,
    )


@app.get("/auth/me", response_model=MeResponse)
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Return the currently authenticated user (decoded from JWT)."""
    payload = verify_jwt(credentials.credentials)
    return MeResponse(
        id=payload["sub"],
        email=payload["email"],
        name=payload["name"],
        picture=payload["picture"],
    )

@app.post("/auth/logout")
async def logout():
    """
    Stateless JWT logout — the client simply discards the token.
    This endpoint exists for completeness / future token-revocation logic.
    """
    return {"message": "Logged out successfully"}


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
