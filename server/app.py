# server/app.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import os
import httpx

from db import query
from auth import (
    create_user,
    verify_user,
    user_role,
    make_jwt,
    get_current_user,
    require_provider,
)

# ---------------------------------------------
# AI MODEL CONFIG
# ---------------------------------------------
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

app = FastAPI(title="PhishGuard API")

# ---------------------------------------------
# CORS
# ---------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------
# HEALTH
# ---------------------------------------------
@app.get("/health")
def health():
    return {"ok": True}

# ============================================================
#                     AUTH SECTION
# ============================================================

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
        raise HTTPException(401, "Bad credentials")
    role = user_role(uid)
    token = make_jwt(uid, role)
    return {"token": token, "role": role}

@app.get("/me")
def me(user=Depends(get_current_user)):
    return user

# ============================================================
#                PUBLIC: MODULE CATALOG
# ============================================================

@app.get("/catalog/modules")
def catalog_modules():
    rows = query("""
        SELECT m.id, m.title, m.description, m.price, u.email
        FROM modules m
        JOIN users u ON u.id = m.created_by
        ORDER BY m.id DESC
    """)
    return [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "price": float(r[3]),
            "provider_email": r[4],
        }
        for r in rows
    ]

# ============================================================
#               PROVIDER: MODULE CRUD
# ============================================================

class NewModule(BaseModel):
    title: str
    description: str = ""
    price: float = 0.0

class UpdateModule(BaseModel):
    title: str
    description: str
    price: float

@app.post("/provider/modules")
def create_module(body: NewModule, user=Depends(require_provider)):
    query("""
        INSERT INTO modules(title, description, price, created_by)
        VALUES(:t,:d,:p,:u)
    """, {"t": body.title, "d": body.description, "p": body.price, "u": user["id"]},
    commit=True)

    new_id = query("SELECT MAX(id) FROM modules WHERE created_by=:u",
                   {"u": user["id"]})[0][0]
    return {"id": int(new_id), "ok": True}

@app.put("/provider/modules/{module_id}")
def update_module(module_id: int, body: UpdateModule, user=Depends(require_provider)):
    owner = query("SELECT created_by FROM modules WHERE id=:m", {"m": module_id})
    if not owner:
        raise HTTPException(404, "Module not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your module")

    query("""
        UPDATE modules
        SET title=:t, description=:d, price=:p
        WHERE id=:m
    """, {"t": body.title, "d": body.description, "p": body.price, "m": module_id},
    commit=True)

    return {"ok": True}

@app.delete("/provider/modules/{module_id}")
def delete_module(module_id: int, user=Depends(require_provider)):
    owner = query("SELECT created_by FROM modules WHERE id=:m", {"m": module_id})
    if not owner:
        raise HTTPException(404, "Module not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your module")

    query("DELETE FROM modules WHERE id=:m", {"m": module_id}, commit=True)
    return {"ok": True}

@app.get("/provider/modules")
def provider_my_modules(user=Depends(require_provider)):
    rows = query("""
        SELECT id, title, description, price
        FROM modules
        WHERE created_by=:u
        ORDER BY id DESC
    """, {"u": user["id"]})
    return [
        {"id": r[0], "title": r[1], "description": r[2], "price": float(r[3])}
        for r in rows
    ]

# ============================================================
#               PROVIDER: SCENARIOS
# ============================================================

class NewScenario(BaseModel):
    channel: str
    prompt: str

@app.post("/provider/modules/{module_id}/scenarios")
def create_scenario(module_id: int, body: NewScenario, user=Depends(require_provider)):
    owner = query("SELECT created_by FROM modules WHERE id=:m", {"m": module_id})
    if not owner:
        raise HTTPException(404, "Module not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your module")

    query("""
        INSERT INTO scenarios(module_id, channel, prompt)
        VALUES(:m,:c,:p)
    """, {"m": module_id, "c": body.channel.upper(), "p": body.prompt},
    commit=True)

    sid = query("SELECT MAX(id) FROM scenarios WHERE module_id=:m",
                {"m": module_id})[0][0]
    return {"id": int(sid), "ok": True}

@app.get("/provider/modules/{module_id}/scenarios")
def provider_list_scenarios(module_id: int, user=Depends(require_provider)):
    owner = query("SELECT created_by FROM modules WHERE id=:m", {"m": module_id})
    if not owner:
        raise HTTPException(404, "Module not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your module")

    rows = query("""
        SELECT id, channel, prompt
        FROM scenarios
        WHERE module_id=:m
        ORDER BY id
    """, {"m": module_id})

    return [
        {"id": r[0], "channel": r[1], "prompt": r[2]}
        for r in rows
    ]

@app.put("/provider/scenarios/{scenario_id}")
def update_scenario(scenario_id: int, body: NewScenario, user=Depends(require_provider)):

    owner = query("""
        SELECT m.created_by
        FROM scenarios s
        JOIN modules m ON m.id = s.module_id
        WHERE s.id=:sid
    """, {"sid": scenario_id})

    if not owner:
        raise HTTPException(404, "Scenario not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your scenario")

    query("""
        UPDATE scenarios
        SET prompt=:p, channel=:c
        WHERE id=:sid
    """, {"p": body.prompt, "c": body.channel.upper(), "sid": scenario_id},
    commit=True)

    return {"ok": True}

@app.delete("/provider/scenarios/{scenario_id}")
def delete_scenario(scenario_id: int, user=Depends(require_provider)):

    owner = query("""
        SELECT m.created_by
        FROM scenarios s
        JOIN modules m ON m.id = s.module_id
        WHERE s.id=:sid
    """, {"sid": scenario_id})

    if not owner:
        raise HTTPException(404, "Scenario not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your scenario")

    query("DELETE FROM scenarios WHERE id=:sid",
          {"sid": scenario_id}, commit=True)

    return {"ok": True}

# ============================================================
#               PROVIDER: CHOICES
# ============================================================

class NewChoice(BaseModel):
    choice_text: str
    is_correct: int

class UpdateChoice(BaseModel):
    choice_text: str
    is_correct: int

@app.post("/provider/scenarios/{scenario_id}/choices")
def add_choice(scenario_id: int, body: NewChoice, user=Depends(require_provider)):

    # Ensure ownership
    owner = query("""
        SELECT m.created_by
        FROM scenarios s
        JOIN modules m ON m.id = s.module_id
        WHERE s.id=:sid
    """, {"sid": scenario_id})

    if not owner:
        raise HTTPException(404, "Scenario not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your scenario")

    query("""
        INSERT INTO choices(scenario_id, choice_text, is_correct)
        VALUES(:sid,:txt,:ok)
    """, {"sid": scenario_id, "txt": body.choice_text, "ok": body.is_correct},
    commit=True)

    cid = query("SELECT MAX(id) FROM choices WHERE scenario_id=:sid",
                {"sid": scenario_id})[0][0]

    return {"id": int(cid), "ok": True}

@app.get("/provider/scenarios/{scenario_id}/choices")
def list_choices(scenario_id: int, user=Depends(require_provider)):
    owner = query("""
        SELECT m.created_by
        FROM scenarios s
        JOIN modules m ON m.id = s.module_id
        WHERE s.id=:sid
    """, {"sid": scenario_id})

    if not owner:
        raise HTTPException(404, "Scenario not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your scenario")

    rows = query("""
        SELECT id, choice_text, is_correct
        FROM choices
        WHERE scenario_id=:sid
        ORDER BY id
    """, {"sid": scenario_id})

    return [
        {"id": r[0], "choice_text": r[1], "is_correct": r[2]}
        for r in rows
    ]

@app.get("/provider/choices/{choice_id}")
def get_choice(choice_id: int, user=Depends(require_provider)):
    row = query("""
        SELECT c.id, c.choice_text, c.is_correct
        FROM choices c
        JOIN scenarios s ON s.id = c.scenario_id
        JOIN modules m ON m.id = s.module_id
        WHERE c.id=:cid AND m.created_by=:uid
    """, {"cid": choice_id, "uid": user["id"]})

    if not row:
        raise HTTPException(404, "Choice not found")

    r = row[0]
    return {"id": r[0], "choice_text": r[1], "is_correct": r[2]}

@app.put("/provider/choices/{choice_id}")
def update_choice(choice_id: int, body: UpdateChoice, user=Depends(require_provider)):

    owner = query("""
        SELECT m.created_by
        FROM choices c
        JOIN scenarios s ON s.id = c.scenario_id
        JOIN modules m ON m.id = s.module_id
        WHERE c.id=:cid
    """, {"cid": choice_id})

    if not owner:
        raise HTTPException(404, "Choice not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your choice")

    query("""
        UPDATE choices
        SET choice_text=:txt, is_correct=:ok
        WHERE id=:cid
    """, {"txt": body.choice_text, "ok": body.is_correct, "cid": choice_id},
    commit=True)

    return {"ok": True}

@app.delete("/provider/choices/{choice_id}")
def delete_choice(choice_id: int, user=Depends(require_provider)):

    owner = query("""
        SELECT m.created_by
        FROM choices c
        JOIN scenarios s ON s.id = c.scenario_id
        JOIN modules m ON m.id = s.module_id
        WHERE c.id=:cid
    """, {"cid": choice_id})

    if not owner:
        raise HTTPException(404, "Choice not found")
    if owner[0][0] != user["id"]:
        raise HTTPException(403, "Not your choice")

    query("DELETE FROM choices WHERE id=:cid",
          {"cid": choice_id}, commit=True)

    return {"ok": True}

# ============================================================
#                     TRAINING (CUSTOMER)
# ============================================================

@app.get("/train/{module_id}/scenarios")
def get_training_scenarios(module_id: int, user=Depends(get_current_user)):
    scenarios = query("""
        SELECT id, channel, prompt
        FROM scenarios
        WHERE module_id=:m
        ORDER BY id
    """, {"m": module_id})

    result = []
    for sc in scenarios:
        sid = sc[0]
        choices = query("""
            SELECT id, choice_text
            FROM choices
            WHERE scenario_id=:sid
            ORDER BY id
        """, {"sid": sid})

        result.append({
            "id": sid,
            "channel": sc[1],
            "prompt": sc[2],
            "choices": [{"id": c[0], "text": c[1]} for c in choices]
        })

    return result

class AttemptBody(BaseModel):
    choice_id: int

@app.post("/train/attempt/{scenario_id}")
def attempt_scenario(scenario_id: int, body: AttemptBody, user=Depends(get_current_user)):

    row = query("""
        SELECT is_correct
        FROM choices
        WHERE id=:cid AND scenario_id=:sid
    """, {"cid": body.choice_id, "sid": scenario_id})

    if not row:
        raise HTTPException(400, "Invalid choice")

    is_correct = bool(row[0][0])

    query("""
        INSERT INTO attempts(user_id, scenario_id, user_choice, is_correct)
        VALUES(:u,:s,:c,:ok)
    """, {
        "u": user["id"],
        "s": scenario_id,
        "c": body.choice_id,
        "ok": 1 if is_correct else 0,
    }, commit=True)

    return {"correct": is_correct}

# ============================================================
#               CUSTOMER: PURCHASE HISTORY
# ============================================================

@app.get("/purchases/mine")
def purchases_mine(user=Depends(get_current_user)):
    rows = query("""
        SELECT module_id
        FROM purchases
        WHERE user_id = :u
    """, {"u": user["id"]})

    # return list like:  [41, 42, 55]
    return {"modules": [int(r[0]) for r in rows]}

@app.post("/purchase/{module_id}")
def purchase_module(module_id: int, user=Depends(get_current_user)):
    # Check module exists
    price_row = query("SELECT price FROM modules WHERE id=:m", {"m": module_id})
    if not price_row:
        raise HTTPException(404, "Module not found")

    price = float(price_row[0][0])

    # Already purchased?
    already = query("""
        SELECT 1 FROM purchases
        WHERE user_id = :u AND module_id = :m
    """, {"u": user["id"], "m": module_id})

    if already:
        raise HTTPException(400, "Already purchased")

    # Check wallet
    wallet = query("""
        SELECT credits FROM wallets WHERE user_id=:u
    """, {"u": user["id"]})

    if not wallet:
        raise HTTPException(400, "Wallet not found")

    credits = float(wallet[0][0])

    if credits < price:
        raise HTTPException(400, "Insufficient funds")

    # Deduct credits
    query("""
        UPDATE wallets
        SET credits = credits - :p
        WHERE user_id=:u
    """, {"p": price, "u": user["id"]}, commit=True)

    # Add purchase
    query("""
        INSERT INTO purchases(user_id, module_id)
        VALUES(:u, :m)
    """, {"u": user["id"], "m": module_id}, commit=True)

    return {"ok": True, "message": "Module purchased successfully"}

# ============================================================
#                     WALLET (REALISTIC SYSTEM)
# ============================================================

class AddCardBody(BaseModel):
    card_number: str
    exp: str
    cvv: str

@app.get("/wallet/balance")
def wallet_balance(user=Depends(get_current_user)):
    row = query("""
        SELECT credits, has_card, last4
        FROM wallets
        WHERE user_id=:u
    """, {"u": user["id"]})

    if not row:
        query("""
            INSERT INTO wallets(user_id, credits, has_card, last4)
            VALUES(:u, 0, 0, NULL)
        """, {"u": user["id"]}, commit=True)
        return {"credits": 0, "has_card": 0, "last4": None}

    r = row[0]
    return {
        "credits": float(r[0]),
        "has_card": int(r[1]),
        "last4": r[2]
    }

@app.post("/wallet/add_card")
def wallet_add_card(body: AddCardBody, user=Depends(get_current_user)):
    last4 = body.card_number[-4:]

    query("""
        UPDATE wallets
        SET has_card=1, last4=:l, credits=50
        WHERE user_id=:u
    """, {"l": last4, "u": user["id"]}, commit=True)

    return {"ok": True, "credits": 50, "last4": last4}


# ============================================================
#                     AI
# ============================================================

def ask_ollama(question: str):
    try:
        with httpx.Client(timeout=10) as c:
            r = c.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": question, "stream": False},
            )
        return r.json().get("response", "").strip()
    except:
        return None

class AskAI(BaseModel):
    question: str

@app.post("/ai/ask")
def ai_ask(body: AskAI, user=Depends(get_current_user)):
    ans = ask_ollama(body.question)
    if ans:
        return {"answer": ans}
    return {"answer": "Hover links, verify sender domains, never share OTPs."}