# server/app.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import oracledb

from db import query
from auth import (
    create_user,
    verify_user,
    user_role,
    make_jwt,
    get_current_user,   # returns {id, email, role}
    require_provider,   # ensures provider; returns same dict
)

app = FastAPI(title="PhishGuard API")

# ---------- CORS (dev-friendly) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    role: str = "CUSTOMER"  # or "PROVIDER"

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

@app.get("/me")
def me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "role": user["role"]}

# ---------- Catalog (public) ----------
@app.get("/catalog/modules")
def catalog_modules():
    rows = query(
        """
        SELECT m.id, m.title, m.description, m.price, u.email AS provider_email
        FROM modules m
        JOIN users u ON u.id = m.created_by
        ORDER BY m.id DESC
        """
    )
    return [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "price": float(r[3]),
            "provider_email": r[4],
        }
        for r in (rows or [])
    ]

# ---------- Provider (modules & scenarios) ----------
class NewModule(BaseModel):
    title: str
    description: str = ""
    price: float = 0.0

@app.get("/provider/modules")
def list_my_modules(user: Dict[str, Any] = Depends(require_provider)):
    rows = query(
        """
        SELECT id, title, description, price
        FROM modules
        WHERE created_by = :1
        ORDER BY id DESC
        """,
        [int(user["id"])],  # positional bind
    )
    return [
        {"id": r[0], "title": r[1], "description": r[2], "price": float(r[3])}
        for r in (rows or [])
    ]

@app.post("/provider/modules")
def create_module(body: NewModule, user: Dict[str, Any] = Depends(require_provider)):
    title = (body.title or "").strip()
    if not title:
        raise HTTPException(400, "title required")
    query(
        "INSERT INTO modules(title, description, price, created_by) VALUES(:t,:d,:p,:uid)",
        {"t": title, "d": body.description or "", "p": body.price or 0, "uid": user["id"]},
        commit=True,
    )
    new_id = query(
        "SELECT MAX(id) FROM modules WHERE created_by=:uid",
        {"uid": user["id"]},
    )[0][0]
    return {"id": int(new_id), "ok": True}

class NewScenario(BaseModel):
    channel: str           # EMAIL | SMS | WEB
    prompt: str
    correct_choice: int    # 0 or 1

@app.post("/provider/modules/{module_id}/scenarios")
def create_scenario(
    module_id: int,
    body: NewScenario,
    user: Dict[str, Any] = Depends(require_provider),
):
    # Ensure provider owns the module
    owner = query("SELECT created_by FROM modules WHERE id=:m", {"m": module_id})
    if not owner:
        raise HTTPException(404, "module not found")
    if int(owner[0][0]) != int(user["id"]):
        raise HTTPException(403, "not your module")

    channel = (body.channel or "").upper()
    if channel not in ("EMAIL", "SMS", "WEB"):
        raise HTTPException(400, "channel must be EMAIL|SMS|WEB")
    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(400, "prompt required")
    if body.correct_choice not in (0, 1):
        raise HTTPException(400, "correct_choice must be 0 or 1")

    query(
        "INSERT INTO scenarios(module_id, channel, prompt, correct_choice) VALUES(:m,:c,:p,:cc)",
        {"m": module_id, "c": channel, "p": prompt, "cc": int(body.correct_choice)},
        commit=True,
    )
    sid = query(
        "SELECT MAX(id) FROM scenarios WHERE module_id=:m",
        {"m": module_id},
    )[0][0]
    return {"id": int(sid), "ok": True}

# ---------- Wallet (simulated payments) ----------
@app.get("/wallet/balance")
def wallet_balance(user: Dict[str, Any] = Depends(get_current_user)):
    row = query("SELECT credits FROM wallets WHERE user_id=:u", {"u": user["id"]})
    credits = float(row[0][0]) if row else 0.0
    return {"credits": credits}

class TopupBody(BaseModel):
    amount: float

@app.post("/wallet/topup")
def wallet_topup(body: TopupBody, user: Dict[str, Any] = Depends(get_current_user)):
    amount = float(body.amount or 0)
    if amount <= 0:
        raise HTTPException(400, "positive amount required")
    query(
        "UPDATE wallets SET credits = NVL(credits,0) + :a WHERE user_id=:u",
        {"a": amount, "u": user["id"]},
        commit=True,
    )
    query(
        "INSERT INTO transactions(user_id, amount, type) VALUES(:u,:a,'TOPUP')",
        {"u": user["id"], "a": amount},
        commit=True,
    )
    new_bal = query(
        "SELECT credits FROM wallets WHERE user_id=:u",
        {"u": user["id"]},
    )[0][0]
    return {"ok": True, "credits": float(new_bal)}

# ---------- Purchase ----------
@app.post("/purchase/{module_id}")
def purchase(module_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    mod = query("SELECT price FROM modules WHERE id=:m", {"m": module_id})
    if not mod:
        raise HTTPException(404, "module not found")
    price = float(mod[0][0])

    bal = query("SELECT NVL(credits,0) FROM wallets WHERE user_id=:u", {"u": user["id"]})
    credits = float(bal[0][0]) if bal else 0.0
    if credits < price:
        raise HTTPException(400, f"insufficient credits: have {credits}, need {price}")

    # Deduct, record purchase & transaction
    query(
        "UPDATE wallets SET credits = credits - :p WHERE user_id=:u",
        {"p": price, "u": user["id"]},
        commit=True,
    )
    query(
        "INSERT INTO purchases(user_id, module_id) VALUES(:u,:m)",
        {"u": user["id"], "m": module_id},
        commit=True,
    )
    query(
        "INSERT INTO transactions(user_id, amount, type) VALUES(:u,:a,'PURCHASE')",
        {"u": user["id"], "a": -price},
        commit=True,
    )
    new_credits = query(
        "SELECT credits FROM wallets WHERE user_id=:u",
        {"u": user["id"]},
    )[0][0]
    return {"ok": True, "credits": float(new_credits)}

# ---------- Training ----------
@app.get("/train/{module_id}/scenarios")
def get_scenarios(module_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    rows = query(
        "SELECT id, channel, prompt FROM scenarios WHERE module_id=:m ORDER BY id",
        {"m": module_id},
    )
    return [{"id": r[0], "channel": r[1], "prompt": r[2]} for r in (rows or [])]

class AttemptBody(BaseModel):
    scenario_id: int
    user_choice: int  # 0/1

@app.post("/train/attempt")
def attempt(body: AttemptBody, user: Dict[str, Any] = Depends(get_current_user)):
    row = query("SELECT correct_choice FROM scenarios WHERE id=:s", {"s": body.scenario_id})
    if not row:
        raise HTTPException(404, "scenario not found")
    is_correct = 1 if int(row[0][0]) == int(body.user_choice) else 0
    query(
        "INSERT INTO attempts(user_id, scenario_id, user_choice, is_correct) VALUES(:u,:s,:c,:ok)",
        {"u": user["id"], "s": body.scenario_id, "c": int(body.user_choice), "ok": is_correct},
        commit=True,
    )
    return {"correct": bool(is_correct)}

# ---------- AI (placeholder) ----------
class AskBody(BaseModel):
    question: str

@app.post("/ai/ask")
def ai_ask(body: AskBody, user: Dict[str, Any] = Depends(get_current_user)):
    q = (body.question or "").lower()
    if "bank" in q or "password" in q:
        return {"answer": "Be cautious of urgent password reset requests and links. Use your bank's official app or site."}
    if "otp" in q or "code" in q:
        return {"answer": "Never share one-time codes. Legitimate support will not ask for your OTP."}
    if "phish" in q or "phishing" in q:
        return {"answer": "Red flags: urgency, mismatched URLs, unexpected attachments, and requests for credentials."}
    return {"answer": "General cyber tip: verify sender domains, hover links, enable MFA, avoid password reuse."}