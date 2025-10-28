# server/app.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import os
import oracledb
import httpx  # <-- for calling local Ollama

from db import query
from auth import (
    create_user,
    verify_user,
    user_role,
    make_jwt,
    get_current_user,   # returns {id, email, role}
    require_provider,   # ensures provider; returns same dict
)

# ---- Local LLM config (Ollama) ----
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

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

@app.get("/ai/status")
def ai_status():
    s = check_ollama_ready()
    ok = s["up"] and s["model_present"]
    resp = {"ok": ok, "ollama": s}
    if not ok:
        resp["how_to_fix"] = [
            "brew services start ollama",
            f"ollama pull {OLLAMA_MODEL}",
        ]
    return resp

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

# ---------- AI via local Ollama (universal /api/generate) ----------
def ask_ollama(question: str, user_email: str = "") -> str | None:
    """
    Calls a local Ollama model using /api/generate (works on all versions).
    Returns the assistant text, or None on failure (so we can fall back).
    """
    system_prompt = (
        "You are PhishGuard, a concise cybersecurity coach for phishing awareness. "
        "Give short, actionable answers (2–5 bullets max). "
        "Never ask for secrets or OTP codes. If asked for personal data, warn the user."
    )
    # Combine system + user into a single prompt (since /api/generate isn't chat-native)
    prompt = (
        f"{system_prompt}\n\n"
        f"User question:\n{(question or '').strip()}\n\n"
        "Respond briefly and clearly."
    )

    try:
        with httpx.Client(timeout=30) as client:
            r = client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,   # defaults to "llama3.2:3b"
                    "prompt": prompt,
                    "stream": False
                },
            )
            r.raise_for_status()
            data = r.json()  # -> {"response": "...", ...}
            return (data.get("response") or "").strip()
    except Exception:
        return None
    
class AskBody(BaseModel):
    question: str

@app.post("/ai/ask")
def ai_ask(body: AskBody, user: Dict[str, Any] = Depends(get_current_user)):
    q = (body.question or "").strip()
    if not q:
        raise HTTPException(400, "question required")

    # 1) Check Ollama status up front
    s = check_ollama_ready()
    if not s["up"] or not s["model_present"]:
        # Return a clear message + diagnostics (so the app can show a friendly banner)
        return {
            "answer": (
                "Local AI isn’t ready yet.\n"
                "• Start Ollama:  brew services start ollama\n"
                f"• Ensure model:  ollama pull {OLLAMA_MODEL}\n"
                f"• API URL:       {OLLAMA_URL}"
            ),
            "diagnostic": s,
        }

    # 2) Try local model
    answer = ask_ollama(q, user_email=user.get("email", ""))
    if answer:
        return {"answer": answer}

    # 3) Fallback text (if API hiccups mid-call)
    low = q.lower()
    if any(k in low for k in ["phish", "phishing", "link", "otp", "password", "bank"]):
        return {
            "answer": (
                "Quick checks:\n"
                "• Be wary of urgency or threats\n"
                "• Hover links for domain mismatches\n"
                "• Don’t share OTPs or passwords\n"
                "• Verify via official app/website\n"
                "• Enable MFA"
            )
        }
    return {
        "answer": "General cyber tip: verify sender, hover links, use MFA, and avoid password reuse."
    }

# ---- Ollama readiness check ----
def check_ollama_ready() -> dict:
    """
    Returns a small status dict:
      {
        "up": bool,                 # Ollama API reachable
        "version": "0.x.y" | None,
        "model_present": bool,      # target model exists locally
        "model": OLLAMA_MODEL,
        "url": OLLAMA_URL
      }
    """
    status = {
        "up": False,
        "version": None,
        "model_present": False,
        "model": OLLAMA_MODEL,
        "url": OLLAMA_URL,
    }
    try:
        with httpx.Client(timeout=5) as c:
            # Is the Ollama API up?
            r = c.get(f"{OLLAMA_URL}/api/version")
            r.raise_for_status()
            status["up"] = True
            try:
                status["version"] = r.json().get("version")
            except Exception:
                pass

            # Does the model exist locally?
            # /api/show returns 200 if present, 404 if missing.
            r2 = c.post(f"{OLLAMA_URL}/api/show", json={"name": OLLAMA_MODEL})
            status["model_present"] = (r2.status_code == 200)
    except Exception:
        # Leave defaults (up=False, model_present=False)
        pass

    return status