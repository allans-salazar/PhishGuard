// phishguard/src/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

/*
  ---------------------------------------------------
  ✅ FIXED LAN IP (RECOMMENDED FOR CAMPUS NETWORK)
  ---------------------------------------------------
  Expo cannot reliably detect your IP on enterprise Wi-Fi.
  You confirmed your real Wi-Fi IP from:

      ipconfig getifaddr en0 → 132.238.110.180

  So we hard-set it for stable AI + API access.
*/

const LOCAL_IP = "172.20.10.9"; // <--- your current real campus IP

// FastAPI backend
const API = `http://${LOCAL_IP}:8000`;

// Ollama backend (FastAPI calls this internally)
const AI = `http://${LOCAL_IP}:11434`;

console.log("🔗 API BASE:", API);
console.log("🤖 AI BASE:", AI);

// ---------------------------------------------------
// AXIOS INSTANCE
// ---------------------------------------------------
const api = axios.create({
  baseURL: API,
  timeout: 30000,
});

const TOKEN_KEY = "phishguard_token";
const ROLE_KEY = "phishguard_role";

// ---------------------------------------------------
// AUTH HEADER HELPERS
// ---------------------------------------------------
export async function applyAuthHeader() {
  const t = await SecureStore.getItemAsync(TOKEN_KEY);
  if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  else delete api.defaults.headers.common["Authorization"];
}

export async function setAuthHeaderFromStorage() {
  const t = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  else delete api.defaults.headers.common["Authorization"];
}

// ---------------------------------------------------
// TOKEN + ROLE HELPERS
// ---------------------------------------------------
export async function saveToken(t) {
  await SecureStore.setItemAsync(TOKEN_KEY, t);
}
export async function loadToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function removeToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveRole(r) {
  return SecureStore.setItemAsync(ROLE_KEY, r);
}
export async function loadRole() {
  return SecureStore.getItemAsync(ROLE_KEY);
}
export async function removeRole() {
  return SecureStore.deleteItemAsync(ROLE_KEY);
}

// ---------------------------------------------------
// AUTH STATE
// ---------------------------------------------------
export async function setAuthToken(token) {
  if (token) await saveToken(token);
  else await removeToken();
  await applyAuthHeader();
}

export async function getRole() {
  const r = await loadRole();
  if (!r) return null;
  const up = r.toUpperCase();
  return up === "CUSTOMER" || up === "PROVIDER" ? up : null;
}

export async function getAuthStatus() {
  return {
    authenticated: !!(await loadToken()),
    role: await getRole(),
  };
}

// ---------------------------------------------------
// AXIOS INTERCEPTOR
// ---------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      return Promise.reject(new Error("Not authenticated. Please log in."));
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------
// AUTH
// ---------------------------------------------------
export async function register(email, password, role) {
  const { data } = await api.post("/auth/register", { email, password, role });
  if (data?.token) {
    await setAuthToken(data.token);
    await saveRole(data.role.toUpperCase());
  }
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  if (data?.token) {
    await setAuthToken(data.token);
    await saveRole(data.role.toUpperCase());
  }
  return data;
}

export async function logout() {
  await removeToken();
  await removeRole();
}

// ---------------------------------------------------
// CATALOG
// ---------------------------------------------------
export async function listCatalog() {
  await applyAuthHeader();
  return (await api.get("/catalog/modules")).data;
}

// ---------------------------------------------------
// PROVIDER
// ---------------------------------------------------
export async function providerListModules() {
  await applyAuthHeader();
  return (await api.get("/provider/modules")).data;
}

export async function providerCreateModule(title, description, price) {
  await applyAuthHeader();
  return (
    await api.post("/provider/modules", { title, description, price })
  ).data;
}

export async function providerUpdateModule(id, title, description, price) {
  await applyAuthHeader();
  return (
    await api.put(`/provider/modules/${id}`, { title, description, price })
  ).data;
}

export async function providerDeleteModule(id) {
  await applyAuthHeader();
  return (await api.delete(`/provider/modules/${id}`)).data;
}

// ---------------------------------------------------
// PROVIDER → SCENARIOS
// ---------------------------------------------------
export async function providerListScenarios(moduleId) {
  await applyAuthHeader();
  return (await api.get(`/provider/modules/${moduleId}/scenarios`)).data;
}

export async function providerCreateScenario(moduleId, channel, prompt) {
  await applyAuthHeader();
  return (
    await api.post(`/provider/modules/${moduleId}/scenarios`, {
      channel,
      prompt,
    })
  ).data;
}

// ---------------------------------------------------
// PROVIDER → CHOICES
// ---------------------------------------------------
export async function providerAddChoice(sid, text, ok) {
  await applyAuthHeader();
  return (
    await api.post(`/provider/scenarios/${sid}/choices`, {
      choice_text: text,
      is_correct: ok,
    })
  ).data;
}

export async function providerListChoices(sid) {
  await applyAuthHeader();
  return (await api.get(`/provider/scenarios/${sid}/choices`)).data;
}

// ---------------------------------------------------
// PURCHASES
// ---------------------------------------------------
export async function listMyPurchases() {
  await applyAuthHeader();
  return (await api.get("/purchases/mine")).data.modules;
}

// ---------------------------------------------------
// WALLET
// ---------------------------------------------------
export async function walletBalance() {
  await applyAuthHeader();
  return (await api.get("/wallet/balance")).data;
}

export async function walletAddCard(card, exp, cvv) {
  await applyAuthHeader();
  return (
    await api.post("/wallet/add_card", { card_number: card, exp, cvv })
  ).data;
}

// ---------------------------------------------------
// TRAINING
// ---------------------------------------------------
export async function getTrainingScenarios(moduleId) {
  return (await api.get(`/train/${moduleId}/scenarios`)).data;
}

export async function attemptScenario(scenarioId, choiceId) {
  return (
    await api.post(`/train/attempt/${scenarioId}`, { choice_id: choiceId })
  ).data;
}

// ---------------------------------------------------
// AI (FastAPI calls Ollama)
// ---------------------------------------------------
export async function askAI(question) {
  console.log("🤖 AI CALLING →", `${API}/ai/ask`);
  
  await applyAuthHeader();

  try {
    const { data } = await api.post("/ai/ask", { question });
    console.log("🤖 AI RESPONSE:", data);
    return data;
  } catch (err) {
    console.log("❌ FRONTEND API ERROR:", err.toJSON ? err.toJSON() : err);
    throw err;
  }
}

export default { api, askAI };