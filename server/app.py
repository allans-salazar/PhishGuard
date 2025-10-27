# server/app.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import jwt
import oracledb

from db import query
from auth import create_user, verify_user, user_role, make_jwt

JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")

app = FastAPI(title="PhishGuard API")

# CORS for local dev (wide open for class/demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Security (adds Swagger "Authorize" button) ----
bearer_scheme = HTTPBearer(auto_error=False)

def require_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> Dict[str, Any]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"uid": int(payload["uid"]), "role": payload.get("role")}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------- Health / Driver / DB ----------
@app.get("/health")
def health():
    return {"ok": True}

@app.get("/driver/mode")
def driver_mode():
    return {"thin_mode": oracledb.is_thin_mode()}

@app.get("/db/ping")
def db_ping():
    rows = query("SELECT SYSTIMESTAMP FROM dual")
    return {"db": "ok", "time": str(rows[0][0])}

# ---------- Auth ----------
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

# ---------- Wallet ----------
@app.post("/wallet/topup")
def wallet_topup(amount: float, user=Depends(require_user)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    # add credits
    query(
        "UPDATE wallets SET credits = NVL(credits,0) + :a WHERE user_id=:u",
        {"a": amount, "u": user["uid"]},
        commit=True,
    )
    # record txn
    query(
        "INSERT INTO transactions(user_id, amount, type) VALUES(:u,:a,'TOPUP')",
        {"u": user["uid"], "a": amount},
        commit=True,
    )
    credits = query("SELECT credits FROM wallets WHERE user_id=:u", {"u": user["uid"]})[0][0]
    return {"ok": True, "credits": float(credits)}

# ---------- Catalog (public list) ----------
@app.get("/catalog/modules")
def list_modules():
    rows = query("SELECT id, title, description, price FROM modules ORDER BY id DESC")
    return [
        {"id": r[0], "title": r[1], "description": r[2], "price": float(r[3])}
        for r in (rows or [])
    ]

# ---------- Provider (create modules & scenarios) ----------
class NewModule(BaseModel):
    title: str
    description: str = ""
    price: float = 0.0

@app.post("/provider/modules")
def create_module(body: NewModule, user=Depends(require_user)):
    if user["role"] != "PROVIDER":
        raise HTTPException(status_code=403, detail="Provider role required")
    query(
        "INSERT INTO modules(title, description, price, created_by) VALUES(:t,:d,:p,:u)",
        {"t": body.title, "d": body.description, "p": body.price, "u": user["uid"]},
        commit=True,
    )
    mid = query("SELECT MAX(id) FROM modules WHERE created_by=:u", {"u": user["uid"]})[0][0]
    return {"id": int(mid)}

class NewScenario(BaseModel):
    module_id: int
    channel: str
    prompt: str
    correct_choice: int  # 0/1 simple

@app.post("/provider/scenarios")
def create_scenario(body: NewScenario, user=Depends(require_user)):
    if user["role"] != "PROVIDER":
        raise HTTPException(status_code=403, detail="Provider role required")
    # Ensure provider owns the module
    own = query(
        "SELECT 1 FROM modules WHERE id=:m AND created_by=:u",
        {"m": body.module_id, "u": user["uid"]},
    )
    if not own:
        raise HTTPException(status_code=403, detail="You don't own this module")
    query(
        "INSERT INTO scenarios(module_id, channel, prompt, correct_choice) VALUES(:m,:c,:p,:cc)",
        {"m": body.module_id, "c": body.channel, "p": body.prompt, "cc": body.correct_choice},
        commit=True,
    )
    sid = query("SELECT MAX(id) FROM scenarios WHERE module_id=:m", {"m": body.module_id})[0][0]
    return {"id": int(sid)}

# ---------- Training (read scenarios) ----------
@app.get("/train/{module_id}/scenarios")
def get_scenarios(module_id: int, user=Depends(require_user)):
    rows = query(
        "SELECT id, channel, prompt FROM scenarios WHERE module_id=:m ORDER BY id",
        {"m": module_id},
    )
    return [{"id": r[0], "channel": r[1], "prompt": r[2]} for r in (rows or [])]

# ---------- Purchase ----------
@app.post("/purchase/{module_id}")
def purchase(module_id: int, user=Depends(require_user)):
    mod = query("SELECT price FROM modules WHERE id=:m", {"m": module_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    price = float(mod[0][0])
    credits = float(
        query("SELECT NVL(credits,0) FROM wallets WHERE user_id=:u", {"u": user["uid"]})[0][0]
    )
    if credits < price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient credits: have {credits}, need {price}",
        )
    # Deduct, record purchase & transaction
    query(
        "UPDATE wallets SET credits = credits - :p WHERE user_id=:u",
        {"p": price, "u": user["uid"]},
        commit=True,
    )
    query(
        "INSERT INTO purchases(user_id, module_id) VALUES(:u,:m)",
        {"u": user["uid"], "m": module_id},
        commit=True,
    )
    query(
        "INSERT INTO transactions(user_id, amount, type) VALUES(:u,:a,'PURCHASE')",
        {"u": user["uid"], "a": -price},
        commit=True,
    )
    new_credits = float(query("SELECT credits FROM wallets WHERE user_id=:u", {"u": user["uid"]})[0][0])
    return {"ok": True, "credits": new_credits}

# ---------- Attempts ----------
class AttemptBody(BaseModel):
    scenario_id: int
    user_choice: int  # 0/1

@app.post("/train/attempt")
def attempt(body: AttemptBody, user=Depends(require_user)):
    row = query("SELECT correct_choice FROM scenarios WHERE id=:s", {"s": body.scenario_id})
    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found")
    is_correct = 1 if int(row[0][0]) == int(body.user_choice) else 0
    query(
        "INSERT INTO attempts(user_id, scenario_id, user_choice, is_correct) VALUES(:u,:s,:c,:ok)",
        {"u": user["uid"], "s": body.scenario_id, "c": body.user_choice, "ok": is_correct},
        commit=True,
    )
    return {"correct": bool(is_correct)}

# ---------- AI (placeholder) ----------
class AskBody(BaseModel):
    question: str

@app.post("/ai/ask")
def ai_ask(body: AskBody):
    q = body.question.lower()
    if "phish" in q or "phishing" in q:
        return {
            "answer": "Red flags: urgent tone, mismatched URLs, unexpected attachments, and requests for credentials."
        }
    return {
        "answer": "Cyber tip: verify sender domain, hover links, enable MFA, and avoid password reuse."
    }