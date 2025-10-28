// phishguard/src/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "http://127.0.0.1:8000"; // use localhost for iOS simulator

let token: string | null = null;

export async function setToken(t: string | null) {
  token = t;
  if (t) await SecureStore.setItemAsync("pg_token", t);
  else await SecureStore.deleteItemAsync("pg_token");
}

export async function loadToken() {
  if (!token) token = await SecureStore.getItemAsync("pg_token");
  return token;
}

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(async (config) => {
  const t = await loadToken();
  if (t) (config.headers as any).Authorization = `Bearer ${t}`;
  return config;
});

// Auth
export async function register(email: string, password: string, role = "CUSTOMER") {
  const { data } = await api.post("/auth/register", { email, password, role });
  await setToken(data.token);
  return data;
}
export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  await setToken(data.token);
  return data;
}
export async function logout() {
  await setToken(null);
}

// Wallet
export async function topup(amount: number) {
  const { data } = await api.post(`/wallet/topup`, null, { params: { amount } });
  return data; // { ok, credits }
}

export async function purchase(moduleId: number) {
  const { data } = await api.post(`/purchase/${moduleId}`);
  return data; // { ok, credits }
}

// Catalog / Provider
export async function listModules() {
  const { data } = await api.get("/catalog/modules");
  return data as { id: number; title: string; description: string; price: number }[];
}
export async function createModule(payload: { title: string; description?: string; price?: number }) {
  const { data } = await api.post("/provider/modules", payload);
  return data; // { id }
}
export async function createScenario(payload: { module_id: number; channel: string; prompt: string; correct_choice: number }) {
  const { data } = await api.post("/provider/scenarios", payload);
  return data; // { id }
}

// Training
export async function getScenarios(moduleId: number) {
  const { data } = await api.get(`/train/${moduleId}/scenarios`);
  return data as { id: number; channel: string; prompt: string }[];
}
export async function attemptScenario(scenario_id: number, user_choice: number) {
  const { data } = await api.post(`/train/attempt`, { scenario_id, user_choice });
  return data; // { correct: boolean }
}

// AI
export async function askAI(question: string) {
  const { data } = await api.post(`/ai/ask`, { question });
  return data as { answer: string };
}