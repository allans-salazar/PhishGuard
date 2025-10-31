
# 🛡️ PhishGuard — Secure Training & Awareness App

**Overview:**  
PhishGuard is a full-stack cybersecurity training mobile application designed to help users recognize and respond to phishing attempts through interactive learning modules and an AI-driven assistant.

---

## ⚙️ Tech Stack

- **Mobile App:** Built with **React Native (Expo)** for a fast, clean, cross-platform UI. The app runs directly from VS Code with an Android simulator or physical device via Expo Go.  
- **Backend API:** Developed in **Python FastAPI**, offering high performance, clear route organization, and automatic documentation (`/docs`).  
- **Database:** **Oracle XE** running in a **Docker container**, accessed via **oracledb** (thin mode). Each developer runs their own isolated database instance locally.  
- **Authentication:** Secure **JWT-based email/password** authentication with user roles (**CUSTOMER** or **PROVIDER**).  
- **Payment Simulation:** Integrated **in-app credit system** that stores transactions (top-ups and purchases) in the Oracle database to mimic a real payment flow.  
- **AI Agent:** Integrated **local LLM** via **Ollama** (`llama3.2:3b`) to provide real-time phishing analysis and cybersecurity guidance without requiring an external API key.  
- **Frontend–Backend Connection:** Axios-based API wrapper (`src/api.ts`) managing token storage, session handling, and secure communication with FastAPI.

---

## 🧭 App Flow

- On launch, users are **prompted with a Login/Register screen** before any app features are available.  
- Once authenticated, they access the **Catalog**, **Provider**, **Training**, and **AI Assistant** tabs.  
- **Providers** can create and manage modules/scenarios.  
- **Customers** can browse and purchase training modules using credits.  
- The **AI tab** offers instant phishing detection tips using the local Ollama model.

---

## 💡 Development Notes

- Always open the workspace at:  
  `PhishGuard_Project/phishguard`  
  Opening the outer folder may break Expo paths or module resolution.
- Always run the app from inside the `phishguard/` folder:  
  ```bash
  npx expo start
  ```
- Backend runs from the `/server` directory:  
  ```bash
  uvicorn app:app --reload
  ```
- Each developer runs their own **Oracle XE Docker container** locally (instructions in *PhishGuard_Windows_Setup_with_Docker.md*).

---

## 🚀 Summary of Capabilities

| Feature | Description |
|----------|--------------|
| **Login/Register Enforcement** | Users must authenticate before accessing app features |
| **Role-Based Access** | Customer and Provider modes define functionality |
| **Simulated Purchases** | In-app credits and mock transactions stored in Oracle |
| **Local AI Assistant** | Runs on-device via Ollama, no external API key required |
| **Training System** | Scenarios simulate phishing channels (Email, SMS, Web) |
| **FastAPI Backend** | Lightweight, documented, JWT-secured API |
| **Expo Mobile Frontend** | Cross-platform mobile app with clean navigation |

---

## 👨‍💻 Collaboration Notes

- Use Git for version control (branch-based workflow).
- Each teammate has their own local Oracle Docker instance.
- No external credentials or API keys are required for development.
- Changes should be committed in feature branches and merged via Pull Requests.

---

**PhishGuard empowers users to train smarter and stay vigilant — bringing cybersecurity education directly to mobile devices.**
