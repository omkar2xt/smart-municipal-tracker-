import React from "react";

const classMap = {
  active: "bg-eco-100 text-eco-700",
  pending: "bg-amber-100 text-amber-700",
  inactive: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
};

export default function StatusBadge({ status }) {
  const normalized = (status || "pending").toLowerCase();
  const badgeClass = classMap[normalized] || "bg-slate-100 text-slate-700";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>{normalized}</span>;
}
