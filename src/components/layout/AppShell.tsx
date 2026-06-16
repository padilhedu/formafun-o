"use client";

import { useState } from "react";
import { SidebarMinimal } from "./SidebarMinimal";
import { Topbar } from "./Topbar";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface Props {
  profile: Profile | null;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      <SidebarMinimal onLogout={handleLogout} />
      <Topbar profile={profile} />

      <main
        className="min-h-screen pt-14 transition-all"
        style={{ marginLeft: "3.5rem" }} /* 56px (w-14) */
      >
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
