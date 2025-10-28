
# PhishGuard — Windows Setup Checklist (Backend + Frontend + Local AI)

> Use this as a one‑pager to get the project running on Windows 10/11.  
> Works with: **Python 3.11–3.13**, **Node.js LTS**, **Expo**, **Ollama (optional)**.

---

## 0) Prereqs

- **Git**: https://git-scm.com/download/win  
- **Node.js (LTS)**: https://nodejs.org (includes npm)  
- **Python 3.11–3.13**: https://www.python.org/downloads/windows/  
  - During install, check **“Add Python to PATH”**.
- **Android emulator** (optional) via **Android Studio** _or_ use **Expo Go** app on your phone.

> 💡 We use the `oracledb` **thin** mode, so **no Oracle Instant Client** needed.

---

## 1) Clone the Repo

```powershell
git clone https://github.com/<org-or-user>/<repo>.git
cd <repo>
```

Project layout (expected):
```
PhishGuard_Project/
├─ server/
├─ app/          # Expo React Native app
└─ database/
```

---

## 2) Configure Environment

Create a file `server/.env` (Windows uses this just like macOS). Example:

```dotenv
# Oracle (thin mode)
DB_USER=PHISHGUARD
DB_PASS=phishguardpwd
DB_HOST=127.0.0.1
DB_PORT=1521
DB_SERVICE=ORCLPDB1

# Auth
JWT_SECRET=devsecret

# Local AI (optional)
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
```

> ✅ **Option A**: Point to a teammate’s running Oracle (ask for DB_HOST/PORT/SERVICE/creds).  
> ✅ **Option B**: Run your own Oracle in Docker (WSL2 required; see the optional section below).

---

## 3) Backend (FastAPI) — Windows

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt

# Run the API
uvicorn app:app --reload --port 8000
```

Test in a browser:
- http://127.0.0.1:8000/health  → `{ "ok": true }`
- http://127.0.0.1:8000/docs    → Swagger UI

> If DB connectivity fails, verify your `.env` and that the Oracle DB is reachable (host/port/service).

---

## 4) Local AI (Optional, Free) — Ollama on Windows

1) Install: https://ollama.com/download  
2) In a terminal:
   ```powershell
   ollama pull llama3.2:3b
   ollama serve
   ```
3) Keep `ollama serve` running while you use the app.  
   The API will call `POST /api/chat` on `http://127.0.0.1:11434`.

> If you skip this, the API falls back to a simple built‑in response so the app still works.

---

## 5) Frontend (Expo) — Windows

```powershell
cd app
npm install

# Start Metro bundler
npx expo start --host=localhost
```
- **Android Emulator**: `a` in the terminal to open Android.  
- **Expo Go (phone)**: Scan the QR (make sure phone & PC are on same Wi‑Fi).  
- If on restricted Wi‑Fi (campus), keep `--host=localhost`.

> If you see React version errors, run `npm ci` to use the exact lockfile, or delete `node_modules` & `package-lock.json` and `npm install` again.

---

## 6) First‑Run Flow (Auth Gate)

- On launch, you should see **Login / Register**.
- After successful login, you’ll be routed to **Catalog**.
- Logout is available from the app’s menu (clears token so you’re prompted next launch).

---

## 7) Useful API Endpoints (for testing with curl)

```powershell
# Register
curl -X POST http://127.0.0.1:8000/auth/register -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"pass123\",\"role\":\"CUSTOMER\"}"

# Login (returns token)
curl -X POST http://127.0.0.1:8000/auth/login -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"pass123\"}"

# Catalog (public)
curl http://127.0.0.1:8000/catalog/modules
```

> For protected routes, include: `-H "Authorization: Bearer <TOKEN>"`

---

## 8) Optional: Oracle in Docker (Windows via WSL2)

1) Install **WSL2** and **Docker Desktop**.  
2) Pull and run an Oracle XE image (example — adjust to your image of choice):
   ```powershell
   docker run -d --name oracle-xe -p 1521:1521 -e ORACLE_ALLOW_REMOTE=true gvenzl/oracle-xe:21-slim
   ```
3) Connect with:
   - HOST: `127.0.0.1`
   - PORT: `1521`
   - SERVICE: `XEPDB1` (varies by image)
4) Create schema using your `database/schema.sql` and seed as needed.

> Oracle Enterprise/Standard images require licensing; XE is free for dev.

---

## 9) Git Workflow

```powershell
git checkout -b feature/<short-name>
# edit files
git add -A
git commit -m "feat: <what you did>"
git push -u origin feature/<short-name>
# open a Pull Request
```

- Keep **server** and **app** changes in separate commits when possible.  
- Before merging, both teammates pull latest and run both the backend & frontend.

---

## 10) Troubleshooting

**Expo cannot open URL / times out**
- Use `npx expo start --host=localhost`
- If emulator can’t connect, try `adb reverse tcp:8000 tcp:8000` (Android) to access local API.

**401 / Not authenticated on app load**
- That’s expected until you log in. Login/Register first, then tabs unlock.

**Ollama 404 / model not found**
- Run `ollama pull llama3.2:3b`
- Keep `ollama serve` running while you test.

**DB ORA- errors**
- Verify `.env` values and that the DB port is reachable.
- Ensure the tables exist (run schema.sql).

---

Happy hacking! 🎯
