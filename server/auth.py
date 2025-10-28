import os, time, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt as jose_jwt, JWTError
from typing import Dict, Any
from db import query

# --- JWT and password setup ---
JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")
JWT_ALGO = "HS256"

pwd_ctx = CryptContext(schemes=["argon2"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=True)

# --- USER CREATION / VERIFICATION ---
def create_user(email: str, password: str, role_name: str = "CUSTOMER") -> int:
    role = query("SELECT id FROM roles WHERE name=:n", {"n": role_name})
    if not role:
        raise HTTPException(400, "Invalid role")
    role_id = role[0][0]

    exists = query("SELECT 1 FROM users WHERE email=:e", {"e": email})
    if exists:
        raise HTTPException(400, "Email already registered")

    pwh = pwd_ctx.hash(password)
    query("INSERT INTO users(email,password_hash,role_id) VALUES(:e,:p,:r)",
          {"e": email, "p": pwh, "r": role_id}, commit=True)

    uid = query("SELECT id FROM users WHERE email=:e", {"e": email})[0][0]
    query("INSERT INTO wallets(user_id,credits) VALUES(:u,0)", {"u": uid}, commit=True)
    return uid


def verify_user(email: str, password: str):
    row = query("SELECT id, password_hash FROM users WHERE email=:e", {"e": email})
    if not row:
        return None
    uid, pwh = row[0]
    return uid if pwd_ctx.verify(password, pwh) else None


def user_role(uid: int) -> str:
    r = query("""SELECT r.name FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=:u""", {"u": uid})
    return r[0][0]


def make_jwt(uid: int, role: str) -> str:
    payload = {"uid": uid, "role": role, "iat": int(time.time())}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# --- TOKEN DECODING & AUTH DEPENDENCIES ---

def decode_jwt(token: str) -> Dict[str, Any]:
    try:
        payload = jose_jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> Dict[str, Any]:
    """
    Extracts and verifies JWT from Authorization header.
    Returns dict like {"id": uid, "role": role}.
    """
    token = creds.credentials
    payload = decode_jwt(token)

    uid = payload.get("uid") or payload.get("id") or payload.get("sub")
    role = payload.get("role")

    if not uid or not role:
        raise HTTPException(status_code=401, detail="Malformed token")

    return {"id": uid, "role": role}


# --- OPTIONAL ROLE GUARDS ---

def require_provider(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if str(user.get("role")).upper() != "PROVIDER":
        raise HTTPException(status_code=403, detail="Providers only")
    return user


def require_customer(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if str(user.get("role")).upper() != "CUSTOMER":
        raise HTTPException(status_code=403, detail="Customers only")
    return user