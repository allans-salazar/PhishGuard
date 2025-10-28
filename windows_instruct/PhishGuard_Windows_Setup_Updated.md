
# 🪟 PhishGuard — Windows Setup Guide (Updated for Current Project Tree)

> This guide is tailored for your current repository structure where the **frontend (Expo app)** lives inside the `phishguard/` directory and the **backend (FastAPI)** lives inside the `server/` directory.  
> It’s meant to help Windows users (like your teammate) set up, run, and contribute to the project.

---

## 📁 Project Structure Overview

```
PhishGuard_Project/
├── phishguard/           # Expo frontend app
│   ├── App.tsx
│   ├── app/
│   │   ├── (auth)/       # Login/Register stack
│   │   ├── (tabs)/       # Post-login tabs (Catalog, Provider, Train, AI)
│   │   ├── _layout.tsx   # Root layout (Auth Gate)
│   │   └── index.tsx
│   ├── src/
│   │   ├── api.ts        # API calls (FastAPI backend)
│   │   └── session.tsx   # Auth/session handling
│   └── assets/           # Icons, splash, etc.
└── server/               # FastAPI backend
    ├── app.py
    ├── auth.py
    ├── db.py
    ├── requirements.txt
    └── __pycache__/
```

---

## ⚙️ 1. Prerequisites (Windows)

Install these tools first:

| Tool | Purpose | Download |
|------|----------|-----------|
| **Git** | Clone & manage code | [git-scm.com](https://git-scm.com/download/win) |
| **Node.js (LTS)** | Run Expo frontend | [nodejs.org](https://nodejs.org/) |
| **Python 3.11+** | Run backend | [python.org](https://www.python.org/downloads/windows/) |
| **Expo Go (App)** | Run on phone | [Play Store / App Store](https://expo.dev/client) |
| **Ollama (Optional)** | Local AI assistant | [ollama.com/download](https://ollama.com/download) |

✅ During Python install: Check **“Add Python to PATH”**.  
✅ During Git install: Enable “Git from the command line.”

---

## 🐍 2. Backend Setup (FastAPI)

1. Open **PowerShell** (in your project root).
   ```powershell
   cd server
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Create a `.env` file inside `server/` (same folder as `app.py`):
   ```dotenv
   DB_USER=PHISHGUARD
   DB_PASS=phishguardpwd
   DB_HOST=127.0.0.1
   DB_PORT=1521
   DB_SERVICE=ORCLPDB1
   JWT_SECRET=devsecret

   # Local AI (optional)
   OLLAMA_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2:3b
   ```

3. Start backend:
   ```powershell
   uvicorn app:app --reload --port 8000
   ```

4. Test the API in browser:
   - http://127.0.0.1:8000/health → `{ "ok": true }`
   - http://127.0.0.1:8000/docs → FastAPI Swagger UI

---

## 🤖 3. Local AI (Optional, Free)

If your teammate wants the local AI working:

```powershell
ollama pull llama3.2:3b
ollama serve
```

Keep `ollama serve` running.  
The backend will automatically connect to it at `http://127.0.0.1:11434`.

If skipped, the AI tab still works using fallback canned responses.

---

## 📱 4. Frontend Setup (Expo)

1. Open a new PowerShell window:
   ```powershell
   cd phishguard
   npm install
   ```

2. Set the backend API base URL in `phishguard/src/api.ts`:
   ```ts
   const BASE = "http://127.0.0.1:8000"; // or LAN IP if testing from phone
   ```

3. Start Expo development server:
   ```powershell
   npx expo start --host=localhost
   ```

4. Running the app:
   - **Android Emulator** → Press `a` in terminal.  
   - **Physical Device** → Scan QR in Expo Go (make sure both are on same Wi-Fi).

---

## 🔐 5. Auth Flow (Login/Register First)

✅ Implemented behavior:
- When the app launches, it **always shows Login/Register first.**
- After logging in:
  - **CUSTOMER** accounts → Catalog tab.
  - **PROVIDER** accounts → Provider tab.
- Logout clears the token (you’ll be prompted again next launch).

If you don’t want to persist the login between runs, `PERSIST_SESSION` in `src/api.ts` is already set to `false`.

---

## 🧠 6. Testing API Endpoints

```powershell
# Register user
curl -X POST http://127.0.0.1:8000/auth/register -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@test.com\",\"password\":\"123\",\"role\":\"CUSTOMER\"}"

# Login
curl -X POST http://127.0.0.1:8000/auth/login -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@test.com\",\"password\":\"123\"}"
```

If successful, you’ll get a JSON response like:
```json
{"token": "eyJhbGciOi...", "role": "CUSTOMER"}
```

---

## ⚡ 7. Common Errors & Fixes

| Error | Cause | Fix |
|-------|--------|-----|
| `ModuleNotFoundError: no module named oracledb` | Python deps missing | Run `pip install -r requirements.txt` |
| `401 Unauthorized` | No token or expired | Re-login in the app |
| `Error Not Authenticated` | API called before login | Expected on cold launch |
| `Ollama 404` | Model not pulled | Run `ollama pull llama3.2:3b` |
| `Expo device can't connect` | Wrong BASE URL | Use LAN IP (same Wi-Fi) |
| `npm ERR!` | Version mismatch | Run `npm ci` or reinstall node_modules |

---

## 🧩 8. Git Workflow (Collaboration)

```powershell
git checkout -b feature/<your-feature>
# make changes
git add -A
git commit -m "feat: added <feature>"
git push origin feature/<your-feature>
```

When ready, open a Pull Request on GitHub.

---

## ✅ 9. Summary of Key Commands

| Task | Command |
|------|----------|
| Create virtual env | `python -m venv .venv` |
| Activate env | `.venv\Scripts\activate` |
| Run backend | `uvicorn app:app --reload` |
| Start Ollama | `ollama serve` |
| Pull model | `ollama pull llama3.2:3b` |
| Run Expo app | `npx expo start` |

---

## 💬 10. Expected App Flow

1️⃣ Open the app → **Login/Register** prompt.  
2️⃣ Log in successfully → Redirected to **Catalog/Provider tabs**.  
3️⃣ Can access AI, train, and purchase modules.  
4️⃣ Logout → Back to login screen.

---

**Now both macOS and Windows teammates can run PhishGuard together with identical results.**
