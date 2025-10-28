// phishguard/src/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "http://127.0.0.1:8000"; // change if needed (LAN IP for device)
const TOKEN_KEY = "phishguard_token";
const ROLE_KEY = "phishguard_role";

// Toggle this to control persistence across app launches.
// false => user sees Login on every fresh launch (your current preference)
const PERSIST_SESSION = false;

const api = axios.create({
  baseURL: BASE,
  timeout: 8000,
});

/** ---------------- Token + Role helpers ---------------- */
export async function saveToken(t: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, t);
}
export async function loadToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}
export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveRole(r: string) {
  await SecureStore.setItemAsync(ROLE_KEY, r);
}
export async function loadRole() {
  return await SecureStore.getItemAsync(ROLE_KEY);
}
export async function removeRole() {
  await SecureStore.deleteItemAsync(ROLE_KEY);
}

export async function hasToken() {
  const t = await loadToken();
  return !!t;
}

/** Set/remove header immediately (synchronous).
 *  Optionally persist/clear depending on PERSIST_SESSION.
 */
export async function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (PERSIST_SESSION) await saveToken(token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    if (PERSIST_SESSION) await removeToken();
  }
}

/** For places where you want to hydrate header from storage (if persisting). */
export async function setAuthHeaderFromStorage() {
  const t = await loadToken();
  if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  else delete api.defaults.headers.common["Authorization"];
}

/** Convenience helpers for UI gating */
export async function getRole(): Promise<"CUSTOMER" | "PROVIDER" | null> {
  const r = await loadRole();
  if (!r) return null;
  const up = r.toUpperCase();
  return (up === "CUSTOMER" || up === "PROVIDER") ? (up as any) : null;
}

export async function getAuthStatus(): Promise<{ authenticated: boolean; role: "CUSTOMER" | "PROVIDER" | null }> {
  const t = await loadToken();
  const r = await getRole();
  return { authenticated: !!t, role: r };
}

/** ---------------- Axios interceptors ---------------- */
// If a 401 sneaks through (e.g., expired token during the session), throw a clean error.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      // Do NOT auto-logout here; just provide a clean message.
      // Your UI can catch and redirect to Login.
      return Promise.reject(new Error("Not authenticated. Please log in."));
    }
    return Promise.reject(err);
  }
);

/** ---------------- Auth endpoints ---------------- */
export async function register(
  email: string,
  password: string,
  role: "CUSTOMER" | "PROVIDER"
) {
  const { data } = await api.post("/auth/register", { email, password, role });
  if (data?.token) {
    await setAuthToken(data.token);
    await saveRole((data.role || role).toUpperCase());
  }
  return data as { token: string; role: "CUSTOMER" | "PROVIDER" };
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  if (data?.token) {
    await setAuthToken(data.token);
    await saveRole((data.role || "CUSTOMER").toUpperCase());
  }
  return data as { token: string; role: "CUSTOMER" | "PROVIDER" };
}

export async function logout() {
  await setAuthToken(null);
  await removeRole();
  // If PERSIST_SESSION=false (your default), there may be no token in storage anyway;
  // this still clears axios header so next calls don’t leak auth.
}

/** ---------------- Catalog & Provider ---------------- */
// Public catalog list (matches your FastAPI: GET /catalog/modules)
export async function listCatalog() {
  const { data } = await api.get("/catalog/modules");
  return data as {
    id: number;
    title: string;
    description: string;
    price: number;
    provider_email: string;
  }[];
}

// Provider: my modules (auth required)
export async function providerListModules() {
  const { data } = await api.get("/provider/modules");
  return data as { id: number; title: string; description: string; price: number }[];
}

export async function providerCreateModule(
  title: string,
  description: string,
  price: number
) {
  const { data } = await api.post("/provider/modules", { title, description, price });
  return data as { id: number; ok: boolean };
}

export async function providerCreateScenario(
  moduleId: number,
  channel: "EMAIL" | "SMS" | "WEB",
  prompt: string,
  correct_choice: 0 | 1
) {
  const { data } = await api.post(`/provider/modules/${moduleId}/scenarios`, {
    channel,
    prompt,
    correct_choice,
  });
  return data as { id: number; ok: boolean };
}

/** ---------------- Wallet & Purchase ---------------- */
export async function walletBalance() {
  // ⛔️ If no token, don't call server at all (prevents 401 popups on first load)
  const t = await loadToken();
  if (!t) {
    return { credits: 0 }; // or return null if you prefer
  }
  await setAuthHeaderFromStorage();
  const { data } = await api.get("/wallet/balance");
  return data as { credits: number };
}

export async function walletTopup(amount: number) {
  const { data } = await api.post("/wallet/topup", { amount });
  return data as { ok: true; credits: number };
}

export async function purchase(moduleId: number) {
  const { data } = await api.post(`/purchase/${moduleId}`);
  return data as { ok: true; credits: number };
}

/** ---------------- AI (local Ollama via server) ---------------- */
export async function askAI(question: string) {
  const { data } = await api.post("/ai/ask", { question });
  return data as { answer: string };
}

/** Default export for convenience */
export default {
  api,
  // token & role helpers
  setAuthToken,
  setAuthHeaderFromStorage,
  saveToken,
  loadToken,
  removeToken,
  saveRole,
  loadRole,
  removeRole,
  getRole,
  getAuthStatus,
  hasToken,
  // auth
  login,
  register,
  logout,
  // catalog & provider
  listCatalog,
  providerListModules,
  providerCreateModule,
  providerCreateScenario,
  // wallet & purchase
  walletBalance,
  walletTopup,
  purchase,
  // ai
  askAI,
};