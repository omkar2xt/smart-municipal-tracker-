import React from "react";
import { BarChart3, LogOut, Map, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function Item({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive ? "bg-civic-600 text-white" : "text-slate-600 hover:bg-civic-50 hover:text-civic-700"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { session, logout } = useAuth();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 px-5 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-eco-700">GeoSentinel OS</p>
        <h2 className="text-2xl font-extrabold text-civic-900">Operations</h2>
      </div>

      <div className="mb-5 rounded-xl bg-civic-50 p-3">
        <p className="text-xs text-slate-500">Signed in as</p>
        <p className="text-sm font-semibold text-civic-900">{session?.name}</p>
        <p className="text-xs text-slate-600">{session?.tier}</p>
      </div>

      <nav className="space-y-1">
        <Item to="/dashboard" icon={<BarChart3 size={16} />} label="Dashboard" />
        <Item to="/map" icon={<Map size={16} />} label="Map Tracking" />
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        <LogOut size={16} />
        Logout
      </button>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-eco-200 bg-eco-50 p-3 text-xs text-eco-700">
        <ShieldCheck size={16} />
        Government-grade monitoring enabled
      </div>
    </aside>
  );
}
