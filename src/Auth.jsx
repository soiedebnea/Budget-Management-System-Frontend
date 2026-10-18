import React, { useState } from "react";
import { api } from "./api";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await (mode === "login" ? api.login(f) : api.register(f));
      onAuth(token, user);
    } catch (err) { setError(err.message); }
  };
  return (
    <main style={{ maxWidth: 420 }}>
      <h1>Budget Manager</h1>
      <section style={{ marginTop: 20 }}>
        <h2>{mode === "login" ? "Log in" : "Create your account"}</h2>
        {error && <p className="error" role="alert">{error}</p>}
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          {mode === "register" && <input placeholder="Name" value={f.name} onChange={set("name")} />}
          <input required type="email" placeholder="Email" value={f.email} onChange={set("email")} />
          <input required type="password" minLength={6} placeholder="Password (6+ characters)" value={f.password} onChange={set("password")} />
          <button>{mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <button className="link" style={{ padding: "12px 0 0" }} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
      </section>
    </main>
  );
}