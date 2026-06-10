"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { Profile } from "@/types/database";

interface Props {
  profile: Profile | null;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar profile={profile} onMenuToggle={() => setSidebarOpen((v) => !v)} />

      <main
        className="min-h-screen pt-14 transition-all"
        style={{ marginLeft: "var(--sidebar-w, 0px)" }}
      >
        <style>{`@media(min-width:1024px){:root{--sidebar-w:224px}}`}</style>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
