// phishguard/src/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "http://132.238.110.162:8000";
const TOKEN_KEY = "phishguard_token";
const ROLE_KEY = "phishguard_role";

const api = axios.create({
  baseURL: BASE,
  timeout: 8000,
});

/* -------------------------------------------------------
   INTERNAL: Always load token into axios
-------------------------------------------------------- */
export async function applyAuthHeader() {
  const t = await SecureStore.getItemAsync(TOKEN_KEY);
  if (t) {
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export async function setAuthHeaderFromStorage() {
  try {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    if (t) {
      api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  } catch (err) {
    console.log("SecureStore read error:", err);
    delete api.defaults.headers.common["Authorization"];
  }
}

/* -------------------------------------------------------
   TOKEN + ROLE HELPERS
-------------------------------------------------------- */
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

/* -------------------------------------------------------
   AUTH TOKEN SETTER
-------------------------------------------------------- */
export async function setAuthToken(token: string | null) {
  if (token) {
    await saveToken(token);
  } else {
    await removeToken();
  }
  await applyAuthHeader();
}

export async function getRole(): Promise<"CUSTOMER" | "PROVIDER" | null> {
  const r = await loadRole();
  if (!r) return null;
  const up = r.toUpperCase();
  return up === "CUSTOMER" || up === "PROVIDER" ? (up as any) : null;
}

export async function getAuthStatus() {
  return {
    authenticated: !!(await loadToken()),
    role: await getRole(),
  };
}

/* -------------------------------------------------------
   AXIOS INTERCEPTOR
-------------------------------------------------------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      return Promise.reject(new Error("Not authenticated. Please log in."));
    }
    return Promise.reject(err);
  }
);

/* -------------------------------------------------------
   AUTH
-------------------------------------------------------- */
export async function register(
  email: string,
  password: string,
  role: "CUSTOMER" | "PROVIDER"
) {
  const { data } = await api.post("/auth/register", { email, password, role });
  if (data?.token) {
    await setAuthToken(data.token);
    await saveRole(data.role.toUpperCase());
  }
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  if (data?.token) {
    await setAuthToken(data.token);
    await saveRole(data.role.toUpperCase());
  }
  console.log("Saving role:", data.role);
  return data;
}

export async function logout() {
  await setAuthToken(null);
  await removeRole();
}

/* -------------------------------------------------------
   CATALOG
-------------------------------------------------------- */
export async function listCatalog() {
  await applyAuthHeader();
  const { data } = await api.get("/catalog/modules");
  return data;
}

/* -------------------------------------------------------
   PROVIDER
-------------------------------------------------------- */
export async function providerListModules() {
  await applyAuthHeader();
  const { data } = await api.get("/provider/modules");
  return data;
}

export async function providerCreateModule(title: string, description: string, price: number) {
  await applyAuthHeader();
  const { data } = await api.post("/provider/modules", { title, description, price });
  return data;
}

export async function providerUpdateModule(moduleId: number, title: string, description: string, price: number) {
  await applyAuthHeader();
  const { data } = await api.put(`/provider/modules/${moduleId}`, {
    title, description, price,
  });
  return data;
}

export async function providerDeleteModule(moduleId: number) {
  await applyAuthHeader();
  const { data } = await api.delete(`/provider/modules/${moduleId}`);
  return data;
}

/* -------------------------------------------------------
   PROVIDER: SCENARIOS
-------------------------------------------------------- */
export async function providerListScenarios(moduleId: number) {
  await applyAuthHeader();
  const { data } = await api.get(`/provider/modules/${moduleId}/scenarios`);
  return data;
}

export async function providerCreateScenario(
  moduleId: number,
  channel: "EMAIL" | "SMS" | "WEB",
  prompt: string
) {
  await applyAuthHeader();
  const { data } = await api.post(`/provider/modules/${moduleId}/scenarios`, {
    channel,
    prompt,
  });
  return data;
}

/* -------------------------------------------------------
   PROVIDER: CHOICES
-------------------------------------------------------- */
export async function providerAddChoice(sid: number, text: string, ok: number) {
  await applyAuthHeader();
  const { data } = await api.post(`/provider/scenarios/${sid}/choices`, {
    choice_text: text,
    is_correct: ok,
  });
  return data;
}

export async function providerListChoices(sid: number) {
  await applyAuthHeader();
  const { data } = await api.get(`/provider/scenarios/${sid}/choices`);
  return data;
}

/* -------------------------------------------------------
   PURCHASE HISTORY
-------------------------------------------------------- */
export async function listMyPurchases() {
  await applyAuthHeader();
  const { data } = await api.get("/purchases/mine");
  return data.modules;
}

/* -------------------------------------------------------
   WALLET
-------------------------------------------------------- */
export async function walletBalance() {
  await applyAuthHeader();
  const { data } = await api.get("/wallet/balance");
  return data;
}

export async function walletAddCard(card_number: string, exp: string, cvv: string) {
  await applyAuthHeader();
  const { data } = await api.post("/wallet/add_card", {
    card_number, exp, cvv,
  });
  return data;
}

export async function purchaseModule(moduleId: number) {
  await applyAuthHeader();
  const { data } = await api.post(`/purchase/${moduleId}`);
  return data;
}

/* -------------------------------------------------------
   TRAINING
-------------------------------------------------------- */
export async function fetchTrainingScenarios(moduleId: number) {
  await applyAuthHeader();
  const { data } = await api.get(`/train/${moduleId}/scenarios`);
  return data;
}

export async function submitAttempt(scenarioId: number, choiceId: number) {
  await applyAuthHeader();
  const { data } = await api.post(`/train/attempt/${scenarioId}`, {
    choice_id: choiceId,
  });
  return data;
}

export async function getTrainingScenarios(moduleId: number) {
  const res = await api.get(`/train/${moduleId}/scenarios`);
  return res.data;
}

export async function attemptScenario(scenarioId: number, choiceId: number) {
  const res = await api.post(`/train/attempt/${scenarioId}`, {
    choice_id: choiceId,
  });
  return res.data;
}

/* -------------------------------------------------------
   AI
-------------------------------------------------------- */
export async function askAI(question: string) {
  console.log("AI CALLING:", api.defaults.baseURL);   // <--- ADD THIS

  await applyAuthHeader();
  const { data } = await api.post("/ai/ask", { question });
  return data;
}

export default {
  api,
  setAuthHeaderFromStorage,
  applyAuthHeader,
  setAuthToken,
  loadToken,
  saveToken,
  removeToken,
  saveRole,
  loadRole,
  removeRole,
  getRole,
  getAuthStatus,
  login,
  register,
  logout,
  listCatalog,
  purchaseModule,
  providerListModules,
  providerCreateModule,
  providerUpdateModule,
  providerDeleteModule,
  providerListScenarios,
  providerCreateScenario,
  providerAddChoice,
  providerListChoices,
  listMyPurchases,
  walletBalance,
  walletAddCard,
  fetchTrainingScenarios,
  getTrainingScenarios,
  attemptScenario,
  submitAttempt,
  askAI,
};