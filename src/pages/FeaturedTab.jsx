import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function FeaturedTab() {
  const [currentFeatured, setCurrentFeatured] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCurrentFeatured();
  }, []);

  async function loadCurrentFeatured() {
    setLoading(true);
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("featured_shop_id")
      .single();

    if (settings?.featured_shop_id) {
      const { data: shop } = await supabase
        .from("shops")
        .select("*")
        .eq("id", settings.featured_shop_id)
        .maybeSingle();
      setCurrentFeatured(shop);
    } else {
      setCurrentFeatured(null);
    }
    setLoading(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("status", "active")
      .ilike("name", `%${searchTerm}%`)
      .limit(10);
    setResults(data ?? []);
  }

  async function handleSetFeatured() {
    if (!selectedShop) return;
    setBusy(true);
    setError(null);

    const { error: settingsError } = await supabase
      .from("platform_settings")
      .update({ featured_shop_id: selectedShop.id })
      .eq("id", true);

    if (settingsError) {
      setBusy(false);
      setError(settingsError.message);
      return;
    }

    if (currentFeatured) {
      await supabase
        .from("featured_placements")
        .update({ ended_at: new Date().toISOString() })
        .eq("shop_id", currentFeatured.id)
        .is("ended_at", null);
    }

    const { error: placementError } = await supabase.from("featured_placements").insert({
      shop_id: selectedShop.id,
      amount_paid: amountPaid ? Number(amountPaid) : 0,
    });

    setBusy(false);
    if (placementError) {
      setError(placementError.message);
      return;
    }

    setSelectedShop(null);
    setResults([]);
    setSearchTerm("");
    setAmountPaid("");
    loadCurrentFeatured();
  }

  async function handleClearFeatured() {
    setBusy(true);
    setError(null);

    await supabase.from("platform_settings").update({ featured_shop_id: null }).eq("id", true);

    if (currentFeatured) {
      await supabase
        .from("featured_placements")
        .update({ ended_at: new Date().toISOString() })
        .eq("shop_id", currentFeatured.id)
        .is("ended_at", null);
    }

    setBusy(false);
    loadCurrentFeatured();
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Featured shop</h2>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-sub" style={{ marginBottom: 10 }}>
          Currently featured
        </div>
        {loading ? (
          <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading…</p>
        ) : currentFeatured ? (
          <div className="card-row">
            <div>
              <div className="card-title">{currentFeatured.name}</div>
              <div className="card-sub">
                {currentFeatured.city}, {currentFeatured.area}
              </div>
            </div>
            <button className="btn btn-danger" disabled={busy} onClick={handleClearFeatured}>
              Remove from featured
            </button>
          </div>
        ) : (
          <p style={{ color: "var(--parchment-200)", opacity: 0.6, margin: 0 }}>
            No shop is currently featured.
          </p>
        )}
      </div>

      <div className="section-header">
        <h2 className="section-title" style={{ fontSize: "1.1rem" }}>
          Set a new featured shop
        </h2>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search active shops by name…"
            style={{
              flex: 1,
              padding: "11px 13px",
              borderRadius: 8,
              border: "1px solid var(--charcoal-700)",
              background: "var(--charcoal-900)",
              color: "var(--parchment-100)",
            }}
          />
          <button type="submit" className="btn btn-ghost">
            Search
          </button>
        </form>

        {results.map((shop) => (
          <div
            key={shop.id}
            className="card-row"
            style={{
              padding: "10px 0",
              borderBottom: "1px solid var(--charcoal-800)",
              cursor: "pointer",
              opacity: selectedShop?.id === shop.id ? 1 : 0.75,
            }}
            onClick={() => setSelectedShop(shop)}
          >
            <div>
              <div className="card-title">{shop.name}</div>
              <div className="card-sub">
                {shop.city}, {shop.area}
              </div>
            </div>
            {selectedShop?.id === shop.id && <span className="status-pill status-active">Selected</span>}
          </div>
        ))}

        {selectedShop && (
          <div style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="amountPaid">Amount paid for this placement (₦)</label>
              <input
                id="amountPaid"
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0"
              />
            </div>
            <button className="btn btn-primary" disabled={busy} onClick={handleSetFeatured}>
              {busy ? "Saving…" : `Feature "${selectedShop.name}"`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
