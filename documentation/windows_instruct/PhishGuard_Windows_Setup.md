
# 🪟 PhishGuard — Windows Setup Guide (with Local Oracle XE via Docker)

> This guide is designed for your existing repository, where the **frontend** is in `/phishguard` (Expo) and the **backend** is in `/server` (FastAPI).  
> These steps let any teammate clone, build, and run the entire stack — including their own local Oracle XE database.

---

## ⚙️ Step 0 — Get the Code via Git

1. Go to your GitHub repository (the one you own).  
2. Your teammate should **fork** it under their own GitHub account.  
3. Then, clone it to their local computer:
   ```powershell
   git clone https://github.com/<their-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
4. Once cloned, they’ll have everything they need — including the `/server` and `/phishguard` folders.  
   *(No need to manually create `.env` or other hidden files — those are already included or not required for local testing.)*

---

## 🐍 Step 1 — Backend (FastAPI) Setup

From the project root:
```powershell
cd server
```

> ⚠️ If your teammate sees a `.venv` folder (from your system), they should **delete it** before creating their own environment:
> ```powershell
> rmdir .venv /s /q
> ```
> This ensures dependencies are installed cleanly on their system.

Now create a new Python environment:
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Then start the backend:
```powershell
uvicorn app:app --reload --port 8000
```

They can confirm it’s working by visiting:
- http://127.0.0.1:8000/health → `{ "ok": true }`
- http://127.0.0.1:8000/docs → Swagger UI

---

## 🐋 Step 2 — Oracle Database (Each Dev Runs Oracle XE Locally in Docker)

This approach ensures **each developer has their own isolated Oracle instance** with identical schema and data.

### 🧱 1. Install Docker Desktop
- Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
- Enable **WSL2 backend** during setup.

### 🪄 2. Run Oracle XE container
Run this in **PowerShell**:
```powershell
docker run -d --name oraclexe `
  -p 1521:1521 -p 5500:5500 `
  -e ORACLE_PASSWORD=oracle `
  -e APP_USER=PHISHGUARD `
  -e APP_USER_PASSWORD=phishguard `
  gvenzl/oracle-xe:21-slim
```

✅ Container details:
- Database user: `PHISHGUARD`  
- Password: `phishguard`  
- Host: `localhost`  
- Port: `1521`  
- Service name: `XEPDB1`

You can check that it’s running:
```powershell
docker ps
```

### 🧩 3. Load the Schema and Data
Once the container is running:
1. Open **SQL Developer** or **SQLcl** and connect as:
   ```
   User: PHISHGUARD
   Password: phishguard
   Host: localhost
   Port: 1521
   Service: XEPDB1
   ```
2. Run:
   - `database/schema.sql` (creates all tables & constraints)
   - `database/data.sql` (optional: inserts sample users, modules, etc.)

Afterward, your teammate’s local database will have the same schema as yours.

### 🔗 4. FastAPI Connection (already configured)
The backend is ready to connect automatically using:
```
Host: localhost
Port: 1521
Service: XEPDB1
User: PHISHGUARD
Password: phishguard
```
No `.env` editing required — the code already handles this in `server/db.py`.

---

## 📱 Step 3 — Frontend (Expo App)

From the root:
```powershell
cd phishguard
npm install
```

Set this in `phishguard/src/api.ts`:
```ts
const BASE = "http://127.0.0.1:8000";
```

Then start the app:
```powershell
npx expo start --host=localhost
```

- **Android Emulator**: Press `a`
- **Physical Device**: Scan QR from Expo Go

---

## 🤖 Step 4 — Local AI (Optional)

```powershell
ollama pull llama3.2:3b
ollama serve
```

Keep `ollama serve` running while using the app’s AI chat feature.

---

## ✅ Step 5 — Full Flow Check

1. Open app → **Login/Register screen appears first**
2. Log in (choose CUSTOMER or PROVIDER)
3. Access tabs: Catalog / Provider / Train / AI
4. Log out → redirected back to login page

---

## ⚡ Step 6 — Common Issues

| Error | Cause | Fix |
|-------|--------|-----|
| `ModuleNotFoundError: no module named oracledb` | Python deps missing | Run `pip install -r requirements.txt` |
| `401 Unauthorized` | No token or expired | Re-login in the app |
| `Error Not Authenticated` | API called before login | Expected on cold launch |
| `Ollama 404` | Model not pulled | Run `ollama pull llama3.2:3b` |
| `Expo device can't connect` | Wrong BASE URL | Use LAN IP (same Wi-Fi) |
| `npm ERR!` | Version mismatch | Run `npm ci` or reinstall node_modules |

---

## 🧩 Step 7 — Git Workflow for Collaboration

```powershell
# Create a new branch for your feature
git checkout -b feature/<your-feature>

# Make and commit changes
git add -A
git commit -m "feat: added <feature>"

# Push to your fork
git push origin feature/<your-feature>
```

Then open a **Pull Request** on GitHub to merge your changes.

---

## ✅ Summary

| Task | Command |
|------|----------|
| Delete old venv | `rmdir .venv /s /q` |
| Create new venv | `python -m venv .venv` |
| Activate venv | `.venv\Scripts\activate` |
| Run backend | `uvicorn app:app --reload` |
| Start Oracle XE | `docker run ...` (see above) |
| Run Expo app | `npx expo start` |
| Start Ollama | `ollama serve` |

---

**Now both macOS and Windows teammates can run PhishGuard together — each with their own Oracle XE and full local stack.**
