# server/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth import create_user, verify_user, user_role, make_jwt
from db import query
import oracledb  # <-- add this import

app = FastAPI(title="PhishGuard API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/driver/mode")
def driver_mode():
    return {"thin_mode": oracledb.is_thin_mode()}

@app.get("/db/ping")
def db_ping():
    try:
        rows = query("SELECT SYSTIMESTAMP FROM dual")
        return {"db": "ok", "time": str(rows[0][0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

class RegisterBody(BaseModel):
    email: str
    password: str
    role: str = "CUSTOMER"

class LoginBody(BaseModel):
    email: str
    password: str

@app.post("/auth/register")
def register(b: RegisterBody):
    uid = create_user(b.email, b.password, b.role.upper())
    role = user_role(uid)
    token = make_jwt(uid, role)
    return {"token": token, "role": role}

@app.post("/auth/login")
def login(b: LoginBody):
    uid = verify_user(b.email, b.password)
    if not uid:
        raise HTTPException(status_code=401, detail="Bad credentials")
    role = user_role(uid)
    token = make_jwt(uid, role)
    return {"token": token, "role": role}