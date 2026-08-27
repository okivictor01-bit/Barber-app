import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadProfile(newSession.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container" style={{ textAlign: "center", paddingTop: 120 }}>
          <p style={{ color: "var(--parchment-200)", opacity: 0.7 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="auth-wrap">
        <div className="auth-eyebrow">BarbFlow Admin</div>
        <h1 className="auth-title">Not authorized</h1>
        <p className="auth-sub">
          This account isn't set up as an admin. Admin access is granted
          manually — run{" "}
          <code>update users set role = 'admin' where email = '…';</code> in
          the Supabase SQL editor for this account, then sign in again.
        </p>
        <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return <AdminPanel />;
}
