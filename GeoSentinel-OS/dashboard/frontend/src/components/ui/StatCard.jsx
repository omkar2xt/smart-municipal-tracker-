import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card p-5"
    >
      <div className="mb-2 flex items-start justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="rounded-xl bg-eco-100 p-2 text-eco-700">{icon}</div>
      </div>
      <p className="text-3xl font-extrabold text-civic-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </motion.div>
  );
}
