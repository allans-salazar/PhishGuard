import os, time, jwt
from passlib.context import CryptContext
from fastapi import HTTPException
from db import query

JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")

pwd_ctx = CryptContext(schemes=["argon2"], deprecated="auto")

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