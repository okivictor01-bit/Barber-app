import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function DisputesTab() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("disputes")
      .select(
        "*, tickets(id, amount, status, shop_id, customer_id, services(name), shops(name), users:customer_id(full_name, phone))"
      )
      .eq("status", "open")
      .order("created_at", { ascending: true });
    if (error) console.error("Failed to load disputes:", error);
    setDisputes(data ?? []);
    setLoading(false);
  }

  async function resolve(disputeId, resolution) {
    setBusyId(disputeId);
    setError(null);
    const { error: rpcError } = await supabase.rpc("resolve_dispute", {
      p_dispute_id: disputeId,
      p_resolution: resolution,
    });
    setBusyId(null);
    if (rpcError) {
      setError(rpcError.message ?? "Could not resolve dispute.");
      return;
    }
    loadDisputes();
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Open disputes</h2>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading…</p>
      ) : disputes.length === 0 ? (
        <div className="empty-state">
          <h3>No open disputes</h3>
          <p>Anything opened by a customer or shop will show up here for review.</p>
        </div>
      ) : (
        disputes.map((dispute) => {
          const t = dispute.tickets;
          return (
            <div className="card" key={dispute.id}>
              <div className="card-title">
                {t?.services?.name || "Service"} at {t?.shops?.name || "shop"}
              </div>
              <div className="card-sub" style={{ marginBottom: 4 }}>
                Customer: {t?.users?.full_name || "—"} · {t?.users?.phone || "no phone"} · Amount: ₦
                {Number(t?.amount ?? 0).toLocaleString()}
              </div>
              <div className="card-sub" style={{ marginBottom: 4 }}>
                Opened by: {dispute.opened_by === t?.customer_id ? "Customer" : "Shop"}
              </div>
              <div style={{ margin: "12px 0", padding: "12px 14px", background: "var(--charcoal-800)", borderRadius: 8 }}>
                <span className="card-sub" style={{ display: "block", marginBottom: 4, opacity: 0.9 }}>
                  Reason given:
                </span>
                {dispute.reason}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={busyId === dispute.id}
                  onClick={() => resolve(dispute.id, "release")}
                >
                  Release to shop
                </button>
                <button
                  className="btn btn-danger"
                  disabled={busyId === dispute.id}
                  onClick={() => resolve(dispute.id, "refund")}
                >
                  Refund customer
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
