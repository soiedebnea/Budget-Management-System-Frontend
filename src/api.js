const BASE = import.meta.env.VITE_API_URL || "/api";
export const getToken = () => localStorage.getItem("token");
export const fileUrl = (name) => BASE.replace(/\/api$/, "") + "/uploads/" + name;
const auth = () => (getToken() ? { Authorization: "Bearer " + getToken() } : {});

async function req(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...auth() },
    body: options.body && !isForm ? JSON.stringify(options.body) : options.body,
  });
  if (res.status === 401 && getToken()) { localStorage.clear(); location.reload(); }
  if (res.status === 204) return null;
  let data;
  try { data = await res.json(); } catch {
    throw new Error("Cannot reach the API. Is the backend running on port 5000?");
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (b) => req("/auth/login", { method: "POST", body: b }),
  register: (b) => req("/auth/register", { method: "POST", body: b }),
  summary: (m) => req(`/summary?month=${m}`),
  budgets: (m) => req(`/budgets?month=${m}`),
  expenses: (m) => req(`/expenses?month=${m}`),
  addBudget: (b) => req("/budgets", { method: "POST", body: b }),
  updateBudget: (id, b) => req(`/budgets/${id}`, { method: "PUT", body: b }),
  delBudget: (id) => req(`/budgets/${id}`, { method: "DELETE" }),
  addExpense: (fd) => req("/expenses", { method: "POST", body: fd }),
  updateExpense: (id, fd) => req(`/expenses/${id}`, { method: "PUT", body: fd }),
  delExpense: (id) => req(`/expenses/${id}`, { method: "DELETE" }),
  recurring: () => req("/recurring"),
  addRecurring: (b) => req("/recurring", { method: "POST", body: b }),
  delRecurring: (id) => req(`/recurring/${id}`, { method: "DELETE" }),
  applyRecurring: () => req("/recurring/apply", { method: "POST" }),
  exportCsv: async (m) => {
    const res = await fetch(`${BASE}/expenses/export?month=${m}`, { headers: auth() });
    if (!res.ok) throw new Error("Export failed");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await res.blob());
    a.download = `expenses-${m}.csv`;
    a.click();
  },
};