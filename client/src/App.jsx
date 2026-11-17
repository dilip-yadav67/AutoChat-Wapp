import { useEffect, useState } from "react";

const api = (key) => async (path, method = "GET", body) => {
  const r = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) throw new Error("Galat admin key");
  return r.status === 204 ? null : r.json();
};

export default function App() {
  const [key, setKey] = useState(localStorage.getItem("key") || "");
  const [tab, setTab] = useState("orders");
  const [data, setData] = useState([]);
  const [err, setErr] = useState("");
  const call = api(key);

  const load = () => key && call("/" + tab).then(setData).catch(e => setErr(e.message));
  useEffect(() => { setErr(""); load(); }, [tab, key]);

  if (!key) return <Login onSave={(k) => { localStorage.setItem("key", k); setKey(k); }} />;

  return (
    <div className="wrap">
      <h2>🛒 WhatsApp Bot Dashboard</h2>
      <div className="tabs">
        {["orders", "conversations", "products"].map(t =>
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
        <button onClick={load}>↻</button>
      </div>
      {err && <p style={{ color: "red" }}>{err}</p>}
      {tab === "orders" && data.map(o => (
        <div className="card" key={o._id}>
          <b>{o.phone}</b> — Rs {o.total} <span className="tag">{o.status}</span>
          <div>{o.items?.map(i => `${i.name} x${i.qty}`).join(", ")}</div>
          <small>📍 {o.address}</small>
          <div className="row">
            {["confirmed", "delivered", "cancelled"].map(s =>
              <button className="sm" key={s} onClick={async () => { await call("/orders/" + o._id, "PATCH", { status: s }); load(); }}>{s}</button>)}
          </div>
        </div>
      ))}
      {tab === "conversations" && data.map(c => (
        <div className="card" key={c._id}>
          <b>{c.phone}</b> {c.handoff && <span className="tag">Owner ki zaroorat</span>}
          {c.handoff && <button className="sm" style={{ marginLeft: 8 }}
            onClick={async () => { await call(`/conversations/${c._id}/resume`, "PATCH"); load(); }}>Bot resume karo</button>}
          {c.messages.slice(-6).map((m, i) => <div key={i} className={"bubble " + m.role}>{m.content}</div>)}
        </div>
      ))}
      {tab === "products" && <Products data={data} call={call} reload={load} />}
    </div>
  );
}

function Products({ data, call, reload }) {
  const [f, setF] = useState({ name: "", price: "", unit: "piece" });
  const add = async () => {
    if (!f.name || !f.price) return;
    await call("/products", "POST", { ...f, price: Number(f.price) });
    setF({ name: "", price: "", unit: "piece" }); reload();
  };
  return (<>
    <div className="card row">
      <input placeholder="Naam (Aata 2kg)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
      <input placeholder="Price" type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} />
      <input placeholder="Unit" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} />
      <button className="sm" onClick={add}>Add</button>
    </div>
    {data.map(p => (
      <div className="card row" key={p._id}>
        <span style={{ flex: 1 }}>{p.name} — Rs {p.price}/{p.unit}</span>
        <button className="sm" onClick={async () => { await call("/products/" + p._id, "PATCH", { inStock: !p.inStock }); reload(); }}>
          {p.inStock ? "In stock" : "Out of stock"}</button>
        <button className="sm" style={{ background: "#e53935" }}
          onClick={async () => { await call("/products/" + p._id, "DELETE"); reload(); }}>Delete</button>
      </div>
    ))}
  </>);
}

function Login({ onSave }) {
  const [k, setK] = useState("");
  return (
    <div className="wrap"><div className="card row">
      <input type="password" placeholder="Admin key (.env wali ADMIN_KEY)" value={k} onChange={e => setK(e.target.value)} />
      <button className="sm" onClick={() => onSave(k)}>Login</button>
    </div></div>
  );
}
