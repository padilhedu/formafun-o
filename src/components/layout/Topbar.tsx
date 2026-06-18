"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface TopbarProps {
  profile: Profile | null;
  onMenuToggle: () => void;
}

function IconBell() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5.5 5.5 0 0 0-5.5 5.5c0 2.5-.7 4-1.5 5h14c-.8-1-1.5-2.5-1.5-5A5.5 5.5 0 0 0 9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M7.5 14.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function IconSearch() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" /><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconMenu() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

const ROLE_LABELS: Record<string, string> = { admin: "Dentista", recepcao: "Recepção" };

const ACOES = [
  { label: "Novo Paciente",    href: "/pacientes/novo" },
  { label: "Novo Orçamento",   href: "/orcamentos/novo" },
  { label: "Novo Agendamento", href: "/agenda" },
  { label: "Nova Despesa",     href: "/financeiro/pagar" },
];

export function Topbar({ profile, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [acoesOpen, setAcoesOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.nome
    ? profile.nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between h-14"
      style={{
        left: 0,
        paddingLeft: "var(--topbar-pl, 1rem)",
        paddingRight: "1.5rem",
        background: "rgba(245,243,239,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      <style>{`@media(min-width:1024px){:root{--topbar-pl:calc(224px + 1.5rem)}}`}</style>

      {/* Esquerda */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 transition-colors"
          style={{ color: "#6B6B66" }}
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1C1C1C")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6B6B66")}
        >
          <IconMenu />
        </button>

        <span className="lg:hidden heading" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#1C1C1C" }}>
          Forma & Função
        </span>

        {/* Busca global — desktop */}
        <button
          className="hidden lg:flex items-center gap-2 transition-colors"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "10px",
            padding: "0.4rem 0.875rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-montserrat)",
            color: "#9B9BA0",
            minWidth: "240px",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1C1C1C")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9B9BA0")}
        >
          <IconSearch />
          <span>Buscar paciente, orçamento...</span>
          <span className="ml-auto" style={{ background: "rgba(0,0,0,0.05)", borderRadius: "4px", padding: "0.1rem 0.35rem", fontSize: "0.65rem" }}>
            ⌘K
          </span>
        </button>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* + Ações */}
        <div className="relative">
          <button
            onClick={() => setAcoesOpen((v) => !v)}
            className="flex items-center gap-1.5 lg:gap-2 font-semibold transition-all"
            style={{
              background: "#1F7A4D",
              color: "#FFFFFF",
              fontFamily: "var(--font-montserrat)",
              fontSize: "0.75rem",
              letterSpacing: "0.02em",
              padding: "0.45rem 0.75rem",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1A6A43")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#1F7A4D")}
          >
            <IconPlus />
            <span className="hidden sm:inline">Ações</span>
            <span className="hidden sm:inline"><IconChevronDown /></span>
          </button>

          {acoesOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAcoesOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 card py-1" style={{ zIndex: 60 }}>
                {ACOES.map((a) => (
                  <button
                    key={a.href}
                    onClick={() => { router.push(a.href); setAcoesOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                    style={{ fontFamily: "var(--font-montserrat)", color: "#1C1C1C" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(31,122,77,0.06)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notificações */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: "#6B6B66", border: "1px solid rgba(0,0,0,0.1)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1C1C1C"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6B6B66"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <IconBell />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#1F7A4D" }} />
        </button>

        {/* Perfil */}
        <div className="relative">
          <button
            className="flex items-center gap-2"
            onClick={() => setPerfilOpen((v) => !v)}
            aria-label="Menu do usuário"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(31,122,77,0.10)", border: "1px solid rgba(31,122,77,0.25)", color: "#1F7A4D", fontFamily: "var(--font-montserrat)" }}
            >
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium leading-tight" style={{ color: "#1C1C1C" }}>{profile?.nome ?? "Usuário"}</div>
              <div style={{ fontSize: "0.65rem", color: "#6B6B66" }}>{profile ? ROLE_LABELS[profile.role] ?? profile.role : ""}</div>
            </div>
          </button>

          {perfilOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPerfilOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-40 card py-1" style={{ zIndex: 50 }}>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs transition-colors"
                  style={{ fontFamily: "var(--font-montserrat)", color: "#C0392B" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
