import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient, PyJWKClientConnectionError, PyJWKClientError
from jwt.exceptions import InvalidTokenError

load_dotenv()

app = FastAPI(title="Auth0 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-zmou7tv4jmkiset2.us.auth0.com").rstrip("/")
AUTH0_ISSUER = f"https://{AUTH0_DOMAIN}/"
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "cadd8f74-68d6-47b6-b2f8-29225e4b68ad")

auth0_security = HTTPBearer()
auth0_jwks_client = PyJWKClient(f"{AUTH0_ISSUER}.well-known/jwks.json")


def verify_auth0_token(
    credentials: HTTPAuthorizationCredentials = Depends(auth0_security),
) -> dict:
    try:
        signing_key = auth0_jwks_client.get_signing_key_from_jwt(credentials.credentials)
        return jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER,
        )
    except PyJWKClientConnectionError as exc:
        raise HTTPException(status_code=503, detail="Unable to fetch Auth0 signing keys") from exc
    except (PyJWKClientError, InvalidTokenError) as exc:
        raise HTTPException(status_code=401, detail="Invalid Auth0 access token") from exc


@app.get("/auth/me")
async def get_me(claims: dict = Depends(verify_auth0_token)):
    """Return selected claims from a verified Auth0 access token."""
    return {
        "sub": claims["sub"],
        "iss": claims["iss"],
        "aud": claims["aud"],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
