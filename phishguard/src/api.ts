// phishguard/src/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "phishguard_token";
const ROLE_KEY = "phishguard_role";
const PERSIST_SESSION = false;

const api = axios.create({
  baseURL: BASE,
  timeout: 8000,
});

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

export async function hasToken() {
  const t = await loadToken();
  return !!t;
}

export async function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (PERSIST_SESSION) await saveToken(token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    if (PERSIST_SESSION) await removeToken();
  }
}

export async function setAuthHeaderFromStorage() {
  const t = await loadToken();
  if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  else delete api.defaults.headers.common["Authorization"];
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
  const { data } = await api.get("/catalog/modules");
  return data;
}

/* -------------------------------------------------------
   PROVIDER: MODULES
-------------------------------------------------------- */
export async function providerListModules() {
  const { data } = await api.get("/provider/modules");
  return data;
}

export async function providerCreateModule(
  title: string,
  description: string,
  price: number
) {
  const { data } = await api.post("/provider/modules", { title, description, price });
  return data;
}

export async function providerUpdateModule(
  moduleId: number,
  title: string,
  description: string,
  price: number
) {
  const { data } = await api.put(`/provider/modules/${moduleId}`, {
    title,
    description,
    price,
  });
  return data;
}

export async function providerDeleteModule(moduleId: number) {
  const { data } = await api.delete(`/provider/modules/${moduleId}`);
  return data;
}

/* -------------------------------------------------------
   PROVIDER: SCENARIOS
-------------------------------------------------------- */
export async function providerCreateScenario(
  moduleId: number,
  channel: "EMAIL" | "SMS" | "WEB",
  prompt: string
) {
  const { data } = await api.post(`/provider/modules/${moduleId}/scenarios`, {
    channel,
    prompt,
  });
  return data;
}

export async function providerUpdateScenario(
  scenarioId: number,
  channel: string,
  prompt: string
) {
  const { data } = await api.put(`/provider/scenarios/${scenarioId}`, {
    channel,
    prompt,
  });
  return data;
}

export async function providerDeleteScenario(scenarioId: number) {
  const { data } = await api.delete(`/provider/scenarios/${scenarioId}`);
  return data;
}

export async function providerListScenarios(moduleId: number) {
  const { data } = await api.get(`/provider/modules/${moduleId}/scenarios`);
  return data;
}

export async function providerGetScenario(scenarioId: number) {
  const { data } = await api.get(`/provider/scenario/${scenarioId}`);
  return data;
}

/* -------------------------------------------------------
   PROVIDER: CHOICES
-------------------------------------------------------- */
export async function providerAddChoice(
  scenarioId: number,
  choice_text: string,
  is_correct: number
) {
  const { data } = await api.post(`/provider/scenarios/${scenarioId}/choices`, {
    choice_text,
    is_correct,
  });
  return data;
}

export async function providerListChoices(scenarioId: number) {
  const { data } = await api.get(`/provider/scenarios/${scenarioId}/choices`);
  return data;
}

export async function providerGetChoice(choiceId: number) {
  const { data } = await api.get(`/provider/choices/${choiceId}`);
  return data;
}

export async function providerUpdateChoice(
  choiceId: number,
  choice_text: string,
  is_correct: number
) {
  const { data } = await api.put(`/provider/choices/${choiceId}`, {
    choice_text,
    is_correct,
  });
  return data;
}

export async function providerDeleteChoice(choiceId: number) {
  const { data } = await api.delete(`/provider/choices/${choiceId}`);
  return data;
}

/* -------------------------------------------------------
   WALLET & PURCHASE  (FIXED)
-------------------------------------------------------- */
export async function walletBalance() {
  const token = await loadToken();
  if (!token) return { credits: 0 };

  await setAuthHeaderFromStorage();
  const { data } = await api.get("/wallet/balance");
  return data;
}

export async function walletTopup(amount: number) {
  const { data } = await api.post("/wallet/topup", { amount });
  return data;
}

export async function purchase(moduleId: number) {
  const { data } = await api.post(`/purchase/${moduleId}`);
  return data;
}

/* -------------------------------------------------------
   TRAINING
-------------------------------------------------------- */
export async function fetchTrainingScenarios(moduleId: number) {
  const { data } = await api.get(`/train/${moduleId}/scenarios`);
  return data;
}

export async function submitAttempt(scenarioId: number, choiceId: number) {
  const { data } = await api.post(`/train/attempt/${scenarioId}`, {
    choice_id: choiceId,
  });
  return data;
}

/* -------------------------------------------------------
   AI
-------------------------------------------------------- */
export async function askAI(question: string) {
  const { data } = await api.post("/ai/ask", { question });
  return data;
}

/* -------------------------------------------------------
   DEFAULT EXPORT
-------------------------------------------------------- */
export default {
  api,
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
  login,
  register,
  logout,
  listCatalog,
  providerListModules,
  providerCreateModule,
  providerUpdateModule,
  providerDeleteModule,
  providerCreateScenario,
  providerUpdateScenario,
  providerDeleteScenario,
  providerListScenarios,
  providerGetScenario,
  providerAddChoice,
  providerListChoices,
  providerGetChoice,
  providerUpdateChoice,
  providerDeleteChoice,
  walletBalance,
  walletTopup,
  purchase,
  fetchTrainingScenarios,
  submitAttempt,
  askAI,
};