"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, Search, Menu, ChevronDown } from "lucide-react";
import type { Profile } from "@/types/database";

interface TopbarProps {
  profile: Profile | null;
  onMenuToggle: () => void;
}

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", recepcao: "Recepção" };

export function Topbar({ profile, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [perfilOpen, setPerfilOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.nome
    ? profile.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "??";

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between"
      style={{
        left: 0,
        paddingLeft: "var(--topbar-pl, 1rem)",
        paddingRight: "1.25rem",
        height: 56,
        background: "#FFFFFF",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
      }}
    >
      {/* Empurra para a direita da sidebar no desktop */}
      <style>{`@media(min-width:1024px){:root{--topbar-pl:calc(248px + 1rem)}}`}</style>

      {/* Esquerda — hamburger mobile */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:bg-elevated transition-colors"
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          style={{ color: "#6B6B66" }}
        >
          <Menu size={18} />
        </button>
        <span
          className="lg:hidden"
          style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 600, color: "#1C1C1C" }}
        >
          Forma & Função
        </span>
      </div>

      {/* Direita — busca + sino + avatar */}
      <div className="flex items-center gap-2">
        {/* Busca — desktop */}
        <button
          className="hidden lg:flex items-center gap-2"
          style={{
            background: "#F5F3EF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 10,
            padding: "0.4rem 0.875rem",
            fontSize: "0.78rem",
            fontFamily: "var(--font-body)",
            color: "#6B6B66",
            minWidth: 220,
            cursor: "text",
          }}
        >
          <Search size={13} style={{ flexShrink: 0 }} />
          <span>Buscar paciente, orçamento...</span>
          <span
            className="ml-auto"
            style={{
              background: "rgba(0,0,0,0.06)",
              borderRadius: 4,
              padding: "0.1rem 0.35rem",
              fontSize: "0.62rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Notificações */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
          style={{ color: "#6B6B66", border: "1px solid rgba(0,0,0,0.08)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#F5F3EF";
            (e.currentTarget as HTMLElement).style.color = "#1C1C1C";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#6B6B66";
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: "absolute", top: 6, right: 7,
              width: 6, height: 6, borderRadius: "50%",
              background: "#1F7A4D",
              border: "1.5px solid #FFFFFF",
            }}
          />
        </button>

        {/* Separador */}
        <div style={{ width: 1, height: 28, background: "rgba(0,0,0,0.08)" }} />

        {/* Avatar + perfil */}
        <div className="relative">
          <button
            onClick={() => setPerfilOpen(v => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors"
            style={{ cursor: "pointer", border: "none", background: "transparent" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F5F3EF"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(31,122,77,0.12)",
                border: "1px solid rgba(31,122,77,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 700, color: "#1F7A4D",
                fontFamily: "var(--font-body)", flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1C1C1C", lineHeight: 1.2 }}>
                {profile?.nome ?? "Usuário"}
              </div>
              <div style={{ fontSize: "0.62rem", color: "#6B6B66" }}>
                {profile ? (ROLE_LABELS[profile.role] ?? profile.role) : ""}
              </div>
            </div>
            <ChevronDown size={12} style={{ color: "#6B6B66" }} className="hidden lg:block" />
          </button>

          {perfilOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPerfilOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 py-1"
                style={{
                  zIndex: 50, minWidth: 160,
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs transition-colors"
                  style={{ fontFamily: "var(--font-body)", color: "#C0392B", background: "transparent", border: "none", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(192,57,43,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
