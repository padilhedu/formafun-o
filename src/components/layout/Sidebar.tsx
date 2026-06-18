"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem { href: string; label: string; icon: React.ReactNode; }
interface NavGroup { title: string; items: NavItem[]; }

function IconChart() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="9" width="3" height="5" rx="1" fill="currentColor" /><rect x="6.5" y="6" width="3" height="8" rx="1" fill="currentColor" /><rect x="11" y="3" width="3" height="11" rx="1" fill="currentColor" /></svg>;
}
function IconPeople() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="11.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" /><path d="M14.5 12.5c0-2.21-1.343-4-3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconDoc() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconCalendar() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 7h12M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconCoin() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v1.5M8 9.5V11M6.5 7c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S8.83 8.5 8 8.5 6.5 9.33 6.5 10.17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconArrowDown() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconArrowUp() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V5M5 8l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconBox() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.3" /><path d="M8 2v13M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function IconMegaphone() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 3.5c0 0-3 1.5-7 1.5H3.5A1.5 1.5 0 0 0 2 6.5v1A1.5 1.5 0 0 0 3.5 9H5l1 4h1.5l.5-4C11 9 12 10.5 12 10.5V3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M13.5 5.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconReport() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4 2.5 2.5L11 7l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function IconSettings() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" /><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function IconLead() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 6.5L8.5 10 6 7.5 3 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 6.5h2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconProtese() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h10M3 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClose() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "COMERCIAL",
    items: [
      { href: "/dashboard",  label: "Dashboard",   icon: <IconChart /> },
      { href: "/leads",      label: "CRM / Leads", icon: <IconLead /> },
      { href: "/orcamentos", label: "Orçamentos",  icon: <IconDoc /> },
      { href: "/contratos",  label: "Contratos",   icon: <IconDoc /> },
    ],
  },
  {
    title: "CLÍNICO",
    items: [
      { href: "/pacientes", label: "Pacientes", icon: <IconPeople /> },
      { href: "/agenda",    label: "Agenda",    icon: <IconCalendar /> },
    ],
  },
  {
    title: "FINANCEIRO",
    items: [
      { href: "/financeiro",         label: "Visão Geral",       icon: <IconCoin /> },
      { href: "/financeiro/receber", label: "Contas a Receber",  icon: <IconArrowDown /> },
      { href: "/financeiro/pagar",   label: "Contas a Pagar",    icon: <IconArrowUp /> },
    ],
  },
  {
    title: "OPERACIONAL",
    items: [
      { href: "/estoque",      label: "Estoque",       icon: <IconBox /> },
      { href: "/protese",      label: "Prótese",       icon: <IconProtese /> },
      { href: "/marketing",    label: "Marketing",     icon: <IconMegaphone /> },
      { href: "/relatorios",   label: "Relatórios",    icon: <IconReport /> },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    COMERCIAL: true, "CLÍNICO": true, FINANCEIRO: true, OPERACIONAL: true,
  });

  useEffect(() => {
    onClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  return (
    <aside
      className="sidebar-panel fixed left-0 top-0 h-screen w-56 flex flex-col z-50 transition-transform duration-300"
      style={{
        background: "#1C1C1C",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <style>{`
        @media (max-width: 1023px) {
          aside.sidebar-panel { transform: ${isOpen ? "translateX(0)" : "translateX(-100%)"}; }
        }
        @media (min-width: 1024px) {
          aside.sidebar-panel { transform: translateX(0) !important; }
        }
      `}</style>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
            style={{ background: "#1F7A4D", color: "#FFFFFF", fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}>
            F
          </div>
          <div>
            <div className="text-white font-semibold leading-tight"
              style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.9rem" }}>
              Forma & Função
            </div>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              Odontologia
            </div>
          </div>
        </div>
        <button
          className="lg:hidden w-7 h-7 flex items-center justify-center transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onClick={onClose}
          aria-label="Fechar menu"
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#fff")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")}
        >
          <IconClose />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-1">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 rounded"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <span style={{ fontSize: "0.57rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {group.title}
              </span>
              <IconChevron open={openGroups[group.title]} />
            </button>

            {openGroups[group.title] && (
              <ul className="space-y-0.5 mb-2">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                          background: active ? "rgba(255,255,255,0.08)" : "transparent",
                          fontFamily: "var(--font-montserrat)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{ color: active ? "#1F7A4D" : "inherit", opacity: active ? 1 : 0.7 }}>
                          {item.icon}
                        </span>
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

      {/* Configurações fixo na base */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "8px 10px" }}>
        <Link
          href="/configuracoes"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            color: isActive("/configuracoes") ? "#FFFFFF" : "rgba(255,255,255,0.55)",
            background: isActive("/configuracoes") ? "rgba(255,255,255,0.08)" : "transparent",
            fontFamily: "var(--font-montserrat)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => {
            const active = isActive("/configuracoes");
            (e.currentTarget as HTMLElement).style.color = active ? "#fff" : "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLElement).style.background = active ? "rgba(255,255,255,0.08)" : "transparent";
          }}
        >
          <span style={{ color: isActive("/configuracoes") ? "#1F7A4D" : "inherit", opacity: isActive("/configuracoes") ? 1 : 0.7 }}>
            <IconSettings />
          </span>
          Configurações
        </Link>
      </div>
    </aside>
  );
}
