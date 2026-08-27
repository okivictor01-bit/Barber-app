import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";
import ShopsTab from "./ShopsTab.jsx";
import DisputesTab from "./DisputesTab.jsx";
import FeaturedTab from "./FeaturedTab.jsx";

const TABS = [
  { id: "shops", label: "Shop approvals" },
  { id: "disputes", label: "Disputes" },
  { id: "featured", label: "Featured shop" },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("shops");

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">✂</span> BarbFlow <span style={{ opacity: 0.5, fontSize: "0.9rem" }}>Admin</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container container-wide">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "shops" && <ShopsTab />}
        {activeTab === "disputes" && <DisputesTab />}
        {activeTab === "featured" && <FeaturedTab />}
      </div>
    </div>
  );
}
