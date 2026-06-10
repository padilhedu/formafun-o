"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function IconChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="3" height="5" rx="1" fill="currentColor" />
      <rect x="6.5" y="6" width="3" height="8" rx="1" fill="currentColor" />
      <rect x="11" y="3" width="3" height="11" rx="1" fill="currentColor" />
    </svg>
  );
}
function IconPeople() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14.5 12.5c0-2.21-1.343-4-3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7h12M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconTooth() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2c-1.5 0-3 1-3 3 0 1.5.5 2.5.5 4.5 0 1.5.5 2.5 1.5 2.5S6.5 11 8 11c1.5 0 2.5 1 3.5 1s1.5-1 1.5-2.5C13 7.5 13.5 6.5 13.5 5c0-2-1.5-3-3-3-1 0-1.5.5-2.5.5S7 2 6 2z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v1.5M8 9.5V11M6.5 7c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S8.83 8.5 8 8.5 6.5 9.33 6.5 10.17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 13V5M5 8l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2v13M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconMegaphone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 3.5c0 0-3 1.5-7 1.5H3.5A1.5 1.5 0 0 0 2 6.5v1A1.5 1.5 0 0 0 3.5 9H5l1 4h1.5l.5-4C11 9 12 10.5 12 10.5V3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13.5 5.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconLead() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 6.5L8.5 10 6 7.5 3 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6.5h2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconProtese() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 5h10M3 8h10M3 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "COMERCIAL",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <IconChart /> },
      { href: "/leads", label: "CRM / Leads", icon: <IconLead /> },
      { href: "/orcamentos", label: "Orçamentos", icon: <IconDoc /> },
      { href: "/contratos", label: "Contratos", icon: <IconDoc /> },
    ],
  },
  {
    title: "CLÍNICO",
    items: [
      { href: "/pacientes", label: "Pacientes", icon: <IconPeople /> },
      { href: "/agenda", label: "Agenda", icon: <IconCalendar /> },
      { href: "/protese", label: "Prótese", icon: <IconProtese /> },
    ],
  },
  {
    title: "FINANCEIRO",
    items: [
      { href: "/financeiro", label: "Visão Geral", icon: <IconCoin /> },
      { href: "/financeiro/receber", label: "Contas a Receber", icon: <IconArrowDown /> },
      { href: "/financeiro/pagar", label: "Contas a Pagar", icon: <IconArrowUp /> },
    ],
  },
  {
    title: "OPERACIONAL",
    items: [
      { href: "/estoque", label: "Estoque", icon: <IconBox /> },
      { href: "/marketing", label: "Marketing", icon: <IconMegaphone /> },
      { href: "/configuracoes", label: "Configurações", icon: <IconSettings /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    COMERCIAL: true,
    CLÍNICO: true,
    FINANCEIRO: true,
    OPERACIONAL: true,
  });

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-30"
      style={{
        background: "#0D0D0F",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: "1px solid rgba(184,154,90,0.35)" }}
        >
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 3C8.477 3 4 7.477 4 13c0 3.09 1.394 5.86 3.6 7.73L14 25l6.4-4.27A9.964 9.964 0 0 0 24 13c0-5.523-4.477-10-10-10Z"
              stroke="#B89A5A"
              strokeWidth="1.8"
              fill="none"
            />
          </svg>
        </div>
        <div>
          <div
            className="text-offwhite font-semibold text-sm leading-tight"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}
          >
            Forma & Função
          </div>
          <div className="text-muted" style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Odontologia
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-1">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 rounded"
              style={{ color: "#8A8A93" }}
            >
              <span style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {group.title}
              </span>
              <IconChevron open={openGroups[group.title]} />
            </button>

            {openGroups[group.title] && (
              <ul className="space-y-0.5 mb-2">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          color: active ? "#B89A5A" : "#8A8A93",
                          background: active ? "rgba(184,154,90,0.1)" : "transparent",
                          fontFamily: "var(--font-montserrat)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.color = "#D9C9A3";
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.color = "#8A8A93";
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{ color: active ? "#B89A5A" : "inherit" }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Footer versão */}
      <div
        className="px-5 py-3 text-muted"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.6rem" }}
      >
        v0.1.0 · Forma & Função
      </div>
    </aside>
  );
}
