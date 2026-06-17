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
    <div className="min-h-screen" style={{ background: "#F5F3EF" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar profile={profile} onMenuToggle={() => setSidebarOpen(v => !v)} />

      <main
        className="min-h-screen transition-all"
        style={{
          marginLeft: "var(--sidebar-w, 0px)",
          paddingTop: 56, /* topbar height */
        }}
      >
        {/* Sidebar width injected via CSS variable */}
        <style>{`@media(min-width:1024px){:root{--sidebar-w:248px}}`}</style>
        <div className="p-4 lg:p-6 xl:p-8">{children}</div>
      </main>
    </div>
  );
}
