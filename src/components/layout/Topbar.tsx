"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface TopbarProps {
  profile: Profile | null;
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2a5.5 5.5 0 0 0-5.5 5.5c0 2.5-.7 4-1.5 5h14c-.8-1-1.5-2.5-1.5-5A5.5 5.5 0 0 0 9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7.5 14.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Dentista",
  recepcao: "Recepção",
};

export function Topbar({ profile }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.nome
    ? profile.nome
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 h-14"
      style={{
        left: "224px",
        background: "rgba(10,10,11,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Busca global */}
      <button
        className="flex items-center gap-2 text-muted transition-colors hover:text-offwhite"
        style={{
          background: "#1A1A1E",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "8px",
          padding: "0.4rem 0.875rem",
          fontSize: "0.75rem",
          fontFamily: "var(--font-montserrat)",
          minWidth: "220px",
        }}
        onClick={() => {
          // TODO: abrir modal de busca global
        }}
      >
        <IconSearch />
        <span>Buscar paciente, orçamento...</span>
        <span
          className="ml-auto"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "4px",
            padding: "0.1rem 0.35rem",
            fontSize: "0.65rem",
            letterSpacing: "0.03em",
          }}
        >
          Ctrl K
        </span>
      </button>

      {/* Ações direita */}
      <div className="flex items-center gap-3">
        {/* Notificações */}
        <button
          className="relative text-muted hover:text-offwhite transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-elevated"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <IconBell />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold"
          />
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-2.5 group relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
            style={{
              background: "rgba(184,154,90,0.15)",
              border: "1px solid rgba(184,154,90,0.3)",
              color: "#B89A5A",
              fontFamily: "var(--font-montserrat)",
            }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-offwhite text-xs font-medium leading-tight">
              {profile?.nome ?? "Usuário"}
            </div>
            <div className="text-muted" style={{ fontSize: "0.65rem" }}>
              {profile ? ROLE_LABELS[profile.role] ?? profile.role : ""}
            </div>
          </div>

          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-2 w-40 card py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
            style={{ zIndex: 50 }}
          >
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-error text-xs hover:bg-elevated transition-colors"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
