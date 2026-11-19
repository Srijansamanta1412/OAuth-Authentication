# Google SSO — React + FastAPI

A minimal but production-ready Single Sign-On implementation using **Google Identity Services** (One Tap / OAuth popup), a **FastAPI** backend that verifies the Google token and issues a JWT, and a **React** frontend that manages the session.

---

## Architecture

```
Browser
  │
  ├─ Loads Google GSI script
  ├─ User clicks "Continue with Google"
  ├─ Google returns an ID token (credential)
  │
  └─► POST /auth/google  { credential }
          │
          ├─ FastAPI verifies token with Google's public keys
          ├─ Issues a signed JWT
          └─► Returns { access_token, user info }

  Subsequent requests
  └─► GET /auth/me   Authorization: Bearer <JWT>
```

## Separate authorization API servers

Google and Auth0 authorization run as separate FastAPI applications:

- The Google API on port `8000` verifies Google credentials and issues the
  app's own HS256 token.
- The Auth0 API on port `8001` verifies Auth0 access tokens against Auth0's
  JWKS, issuer, and audience.

The frontend requests an Auth0 access token for the audience configured in
`Frontend/src/main.jsx` and sends it to the Auth0 API. Set matching backend
values with `AUTH0_DOMAIN` (tenant hostname, without `https://`) and
`AUTH0_AUDIENCE` (the API Identifier). `VITE_AUTH0_API_URL` can override the
Auth0 API URL; it defaults to `http://localhost:8001`.

The dashboard shows the Auth0 API button for an Auth0 session or the
self-issued-JWT API button for a Google session. Each button calls its own
server's protected `/auth/me` endpoint and displays the returned JSON.

---

## 1 — Google Cloud Console setup

1. Go to [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. **Create credentials → OAuth 2.0 Client ID → Web application**
3. Add **Authorised JavaScript origins**: `http://localhost:5173`
4. Add **Authorised redirect URIs**: `http://localhost:5173` (GSI doesn't need a redirect URI for One Tap, but add it anyway)
5. Copy the **Client ID** — it looks like `12345-abc.apps.googleusercontent.com`

---

## 2 — Backend setup

```bash
cd backend

# copy and fill in env vars
cp .env.example .env
# edit .env: set GOOGLE_CLIENT_ID and JWT_SECRET

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run from Backend in two terminals:
uvicorn main:app --reload --port 8000
# → Google API: http://localhost:8000
# → Swagger UI: http://localhost:8000/docs
```

In a second terminal, from `Backend`:

```bash
uvicorn auth0_main:app --reload --port 8001
# → Auth0 API: http://localhost:8001
# → Swagger UI: http://localhost:8001/docs
```

### API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/google` | — | Exchange Google ID token for a JWT |
| GET | `/auth/me` | Bearer JWT | Return current user |
| POST | `/auth/logout` | — | Stateless logout (client discards token) |
| GET | `/health` | — | Health check |

The Auth0 server exposes its own protected `GET /auth/me` endpoint and
`GET /health`. Add `Depends(verify_auth0_token)` from `auth0_main.py` to its
other protected routes.

---

## 3 — Frontend setup

```bash
cd frontend

cp .env.example .env
# edit .env: set VITE_GOOGLE_CLIENT_ID (same value as backend)

npm install
npm run dev
# → http://localhost:5173
```

---

## 4 — Project structure

```
google-sso/
├── Backend/
│   ├── main.py           # Google authorization API
│   ├── auth0_main.py     # Auth0 authorization API
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx      # React entry
        ├── index.css     # Global tokens
        ├── App.jsx       # Router (login ↔ dashboard)
        ├── AuthContext.jsx  # Auth state + API calls
        ├── LoginPage.jsx    # Google Sign-In button
        └── Dashboard.jsx    # Protected page
```

---

## Security notes

- The Google ID token is **verified server-side** using `google-auth` — never trust it client-side only.
- The JWT is signed with `HS256` and expires in 24 hours. In production use `RS256` with a key pair.
- Replace `JWT_SECRET` with a long random string (`openssl rand -hex 32`).
- In production, set `allow_origins` in CORS to your actual domain.
- Tokens are stored in `localStorage`; for higher security consider `httpOnly` cookies.
