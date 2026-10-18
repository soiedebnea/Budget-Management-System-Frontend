import React, { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api, fileUrl } from "./api";
import Auth from "./Auth";
import Recurring from "./Recurring";

const COLORS = ["#0f766e", "#b45309", "#1d4ed8", "#9d174d", "#4d7c0f", "#6d28d9", "#0e7490"];
const money = (n) => "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");
  const [bForm, setBForm] = useState({ category: "", limit: "" });
  const [eForm, setEForm] = useState({ title: "", amount: "", category: "", date: today() });

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [editB, setEditB] = useState(null);
  const [editE, setEditE] = useState(null);
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      await api.applyRecurring();
      const [s, b, e] = await Promise.all([api.summary(month), api.budgets(month), api.expenses(month)]);
      setSummary(s); setBudgets(b); setExpenses(e); setError("");
    } catch (err) { setError(err.message); }
  }, [month, user]);
  useEffect(() => { load(); }, [load]);

  const run = (fn) => async (ev) => {
    ev.preventDefault();
    try { await fn(); await load(); } catch (err) { setError(err.message); }
  };
  const saveBudget = run(async () => {
    const body = { category: bForm.category, limit: +bForm.limit };
    if (editB) await api.updateBudget(editB, body); else await api.addBudget({ ...body, month });
    setEditB(null); setBForm({ category: "", limit: "" });
  });
  const saveExpense = run(async () => {
    const fd = new FormData();
    Object.entries(eForm).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("receipt", file);
    if (editE) await api.updateExpense(editE, fd); else await api.addExpense(fd);
    setEditE(null); setFile(null); setEForm({ ...eForm, title: "", amount: "" });
  });
  const remove = (fn, id) => async () => { try { await fn(id); await load(); } catch (err) { setError(err.message); } };

  const cats = summary?.categories ?? [];
  const spentCats = cats.filter((c) => c.spent > 0);
  const over = summary && summary.remaining < 0;
  const alerts = cats.filter((c) => c.percent >= 80);
  const onAuth = (t, u) => { localStorage.setItem("token", t); localStorage.setItem("user", JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.clear(); setUser(null); setSummary(null); };
  if (!user) return <Auth onAuth={onAuth} />;

  return (
    <main>
      <header>
        <h1>Budget Manager</h1>
        <div className="bar">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
          <button className="ghost" onClick={() => api.exportCsv(month).catch((e) => setError(e.message))}>Export CSV</button>
          <button className="ghost" onClick={logout}>Log out{user.name ? ` (${user.name})` : ""}</button>
        </div>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {alerts.map((c) => (
        <p key={c.category} className={"alert " + (c.percent >= 100 ? "bad" : "")} role="status">
          {c.category}: {c.percent >= 100 ? `over budget by ${money(-c.remaining)}` : `${c.percent}% of budget used`}
        </p>
      ))}

      {summary && (
        <section className="hero">
          <div>
            <p className="muted">{over ? "Over budget by" : "Left to spend this month"}</p>
            <p className={"big " + (over ? "bad" : "")}>{money(Math.abs(summary.remaining))}</p>
          </div>
          <div className="meter" aria-hidden>
            <span style={{ width: Math.min(100, summary.totalBudget ? (summary.totalSpent / summary.totalBudget) * 100 : 0) + "%" }} className={over ? "bad" : ""} />
          </div>
          <p className="muted">{money(summary.totalSpent)} spent of {money(summary.totalBudget)} budgeted</p>
        </section>
      )}

      <div className="grid">
        <section>
          <h2>Budget vs. spent</h2>
          {cats.length === 0 ? <p className="muted">Set a budget below to see your chart.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cats}>
                <XAxis dataKey="category" /><YAxis /><Tooltip formatter={money} /><Legend />
                <Bar dataKey="limit" name="Budget" fill="#9db8b3" radius={[3, 3, 0, 0]} />
                <Bar dataKey="spent" name="Spent" fill="#0f766e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
        <section>
          <h2>Where the money went</h2>
          {spentCats.length === 0 ? <p className="muted">Add an expense to see the breakdown.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={spentCats} dataKey="spent" nameKey="category" innerRadius={55} outerRadius={95}>
                  {spentCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={money} /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <div className="grid">
        <section>
          <h2>Budgets</h2>
          <form onSubmit={saveBudget} className="row">
            <input required placeholder="Category (e.g. Groceries)" value={bForm.category} onChange={(e) => setBForm({ ...bForm, category: e.target.value })} />
            <input required type="number" min="0" step="0.01" placeholder="Limit" value={bForm.limit} onChange={(e) => setBForm({ ...bForm, limit: e.target.value })} />
            <button>{editB ? "Save changes" : "Set budget"}</button>
          </form>
          <ul>
            {cats.map((c) => {
              const b = budgets.find((x) => x.category === c.category);
              return (
                <li key={c.category}>
                  <div className="line"><strong>{c.category}</strong>
                    <span>{money(c.spent)} / {money(c.limit)}
                      {b && <>
                        <button className="link" onClick={() => { setEditB(b._id); setBForm({ category: b.category, limit: b.limit }); }}>Edit</button>
                        <button className="link" onClick={remove(api.delBudget, b._id)}>Remove</button></>}</span></div>
                  <div className="meter small"><span className={c.percent > 100 ? "bad" : c.percent > 80 ? "warn" : ""} style={{ width: Math.min(100, c.percent ?? 0) + "%" }} /></div>
                  {!b && <p className="muted">No budget set for this category.</p>}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2>Expenses</h2>
          <form onSubmit={saveExpense} className="row wrap">
            <input required placeholder="What was it?" value={eForm.title} onChange={(e) => setEForm({ ...eForm, title: e.target.value })} />
            <input required type="number" min="0.01" step="0.01" placeholder="Amount" value={eForm.amount} onChange={(e) => setEForm({ ...eForm, amount: e.target.value })} />
            <input required list="cats" placeholder="Category" value={eForm.category} onChange={(e) => setEForm({ ...eForm, category: e.target.value })} />
            <datalist id="cats">{cats.map((c) => <option key={c.category} value={c.category} />)}</datalist>
            <input required type="date" value={eForm.date} onChange={(e) => setEForm({ ...eForm, date: e.target.value })} />
            <input key={file ? "has" : "none"} type="file" accept="image/*,application/pdf" title="Receipt (optional)" onChange={(e) => setFile(e.target.files[0] || null)} />
            <button>{editE ? "Save changes" : "Add expense"}</button>
          </form>
          {expenses.length === 0 ? <p className="muted">No expenses this month yet.</p> : (
            <ul>
              {expenses.map((x) => (
                <li key={x._id} className="line">
                  <span>{x.title}<small className="muted"> {x.category} · {x.date.slice(0, 10)}</small></span>
                  <span>{money(x.amount)}
                    {x.receipt && <a className="link" style={{ paddingLeft: 10 }} href={fileUrl(x.receipt)} target="_blank" rel="noreferrer">Receipt</a>}
                    <button className="link" onClick={() => { setEditE(x._id); setEForm({ title: x.title, amount: x.amount, category: x.category, date: x.date.slice(0, 10) }); }}>Edit</button>
                    <button className="link" onClick={remove(api.delExpense, x._id)}>Delete</button></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Recurring onChange={load} />
    </main>
  );
}