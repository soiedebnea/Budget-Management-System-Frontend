import React, { useEffect, useState } from "react";
import { api } from "./api";

export default function Recurring({ cats, onChange }) {
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ title: "", amount: "", category: "", dayOfMonth: 1 });
  const [error, setError] = useState("");
  const load = () => api.recurring().then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault();
    try {
      await api.addRecurring({ ...f, amount: +f.amount, dayOfMonth: +f.dayOfMonth });
      await api.applyRecurring();
      setF({ ...f, title: "", amount: "" });
      setError(""); load(); onChange();
    } catch (err) { setError(err.message); }
  };
  const del = async (id) => { await api.delRecurring(id); load(); };
  return (
    <section>
      <h2>Recurring expenses</h2>
      <p className="muted" style={{ marginBottom: 12 }}>Added automatically once each month. Deleting one stops future entries; past expenses stay.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <form onSubmit={add} className="row wrap">
        <input required placeholder="e.g. Rent" value={f.title} onChange={set("title")} />
        <input required type="number" min="0.01" step="0.01" placeholder="Amount" value={f.amount} onChange={set("amount")} />
        <input required list="cats" placeholder="Category" value={f.category} onChange={set("category")} />
        <input required type="number" min="1" max="28" title="Day of month" value={f.dayOfMonth} onChange={set("dayOfMonth")} />
        <button>Add recurring</button>
      </form>
      {items.length === 0 ? <p className="muted">No recurring expenses yet.</p> : (
        <ul>{items.map((r) => (
          <li key={r._id} className="line">
            <span>{r.title}<small className="muted"> {r.category} · day {r.dayOfMonth}</small></span>
            <span>${r.amount} <button className="link" onClick={() => del(r._id)}>Delete</button></span>
          </li>
        ))}</ul>
      )}
    </section>
  );
}