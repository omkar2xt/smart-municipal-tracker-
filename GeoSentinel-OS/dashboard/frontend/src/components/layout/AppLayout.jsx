import React from "react";

import MobileBottomNav from "./MobileBottomNav";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main className="w-full px-4 pb-24 pt-5 md:px-6 lg:px-8 lg:pb-8 lg:pt-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
