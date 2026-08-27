import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
];

export default function ShopsTab() {
  const [filter, setFilter] = useState("pending");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShops();
  }, [filter]);

  async function loadShops() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shops")
      .select("*, users:owner_id(full_name, email, phone), affiliates(referral_code)")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    if (error) console.error("Failed to load shops:", error);
    setShops(data ?? []);
    setLoading(false);
  }

  async function setStatus(shopId, status) {
    setBusyId(shopId);
    setError(null);
    const { error: updateError } = await supabase.from("shops").update({ status }).eq("id", shopId);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message ?? "Could not update shop status.");
      return;
    }
    loadShops();
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Shop approvals</h2>
        <div className="tabs" style={{ border: "none", marginBottom: 0 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`tab ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
              style={{ marginRight: 16 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading…</p>
      ) : shops.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing here</h3>
          <p>No shops with status "{filter}" right now.</p>
        </div>
      ) : (
        shops.map((shop) => (
          <div className="card" key={shop.id}>
            <div className="card-row">
              <div>
                <div className="card-title">{shop.name}</div>
                <div className="card-sub">
                  {shop.city}, {shop.area}
                </div>
                <div className="card-sub">
                  Owner: {shop.users?.full_name || "—"} · {shop.users?.email} · {shop.users?.phone || "no phone"}
                </div>
                {shop.affiliates?.referral_code && (
                  <div className="card-sub">Referred via: {shop.affiliates.referral_code}</div>
                )}
                {shop.description && <div className="card-sub" style={{ marginTop: 6 }}>{shop.description}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {filter !== "active" && (
                  <button
                    className="btn btn-primary"
                    disabled={busyId === shop.id}
                    onClick={() => setStatus(shop.id, "active")}
                  >
                    Approve
                  </button>
                )}
                {filter !== "suspended" && (
                  <button
                    className="btn btn-danger"
                    disabled={busyId === shop.id}
                    onClick={() => setStatus(shop.id, "suspended")}
                  >
                    Suspend
                  </button>
                )}
                {filter === "suspended" && (
                  <button
                    className="btn btn-ghost"
                    disabled={busyId === shop.id}
                    onClick={() => setStatus(shop.id, "pending")}
                  >
                    Move to pending
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
