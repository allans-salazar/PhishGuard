// phishguard/src/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "http://127.0.0.1:8000"; // change if needed

const api = axios.create({
  baseURL: BASE,
  timeout: 8000,
});

// --- Token helpers ---
const TOKEN_KEY = "phishguard_token";

export async function saveToken(t: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, t);
}

export async function loadToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// attach token to axios
export async function setAuthHeaderFromStorage() {
  const t = await loadToken();
  if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  else delete api.defaults.headers.common["Authorization"];
}

// --- Auth endpoints ---
export async function register(email: string, password: string, role: "CUSTOMER" | "PROVIDER") {
  const { data } = await api.post("/auth/register", { email, password, role });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  // assume server returns { token: "..." } or similar
  if (data?.token) {
    await saveToken(data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  }
  return data;
}

export async function logout() {
  await removeToken();
  delete api.defaults.headers.common["Authorization"];
}

// --- Example protected API helpers (use after login) ---
export async function listModules() {
  // GET /provider/modules or /modules depending on backend; adjust path if needed
  const { data } = await api.get("/modules"); 
  return data;
}

export async function topup(amount: number) {
  const { data } = await api.post("/wallet/topup", { amount });
  return data;
}

export async function listCatalog() {
  const { data } = await api.get("/catalog/modules");
  return data as { id:number; title:string; description:string; price:number; provider_email:string }[];
}

export async function walletBalance() {
  await setAuthHeaderFromStorage();
  const { data } = await api.get("/wallet/balance");
  return data as { credits: number };
}

export async function walletTopup(amount: number) {
  await setAuthHeaderFromStorage();
  const { data } = await api.post("/wallet/topup", { amount });
  return data;
}

export async function purchase(moduleId: number) {
  await setAuthHeaderFromStorage();
  const { data } = await api.post(`/purchase/${moduleId}`);
  return data;
}

export async function providerListModules() {
  await setAuthHeaderFromStorage();
  const { data } = await api.get("/provider/modules");
  return data as { id:number; title:string; description:string; price:number }[];
}

export async function providerCreateModule(title: string, description: string, price: number) {
  await setAuthHeaderFromStorage();
  const { data } = await api.post("/provider/modules", { title, description, price });
  return data as { id:number; ok:boolean };
}

export async function providerCreateScenario(moduleId: number, channel: "EMAIL"|"SMS"|"WEB", prompt: string, correct_choice: 0|1) {
  await setAuthHeaderFromStorage();
  const { data } = await api.post(`/provider/modules/${moduleId}/scenarios`, { channel, prompt, correct_choice });
  return data as { id:number; ok:boolean };
}

// --- AI (chat helper) ---
export async function askAI(question: string) {
  await setAuthHeaderFromStorage(); // if your other calls use this
  const { data } = await api.post("/ai/ask", { question });
  return data as { answer: string };
}

// export default if you like named imports
export default {
  api,
  saveToken,
  loadToken,
  removeToken,
  setAuthHeaderFromStorage,
  register,
  login,
  logout,
  listModules,
  topup,
  purchase,
};