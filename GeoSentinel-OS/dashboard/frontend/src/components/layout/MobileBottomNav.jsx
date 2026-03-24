import React from "react";
import { BarChart3, LogOut, Map } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function MobileBottomNav() {
  const { logout } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center rounded-xl py-2 text-xs ${isActive ? "bg-civic-600 text-white" : "text-slate-600"}`
          }
        >
          <BarChart3 size={16} />
          Dashboard
        </NavLink>
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center rounded-xl py-2 text-xs ${isActive ? "bg-civic-600 text-white" : "text-slate-600"}`
          }
        >
          <Map size={16} />
          Map
        </NavLink>
        <button
          type="button"
          onClick={logout}
          className="flex flex-col items-center rounded-xl py-2 text-xs text-red-600"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
