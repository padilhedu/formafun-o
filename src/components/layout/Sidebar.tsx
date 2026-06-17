"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Smile, FileText,
  ScrollText, DollarSign, Package, Settings, ChevronLeft,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: React.ReactNode }

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",   icon: <LayoutDashboard size={16} /> },
  { href: "/agenda",      label: "Agenda",       icon: <Calendar size={16} /> },
  { href: "/pacientes",   label: "Pacientes",    icon: <Users size={16} /> },
  { href: "/pacientes",   label: "Odontograma",  icon: <Smile size={16} /> },
  { href: "/orcamentos",  label: "Orçamentos",   icon: <FileText size={16} /> },
  { href: "/contratos",   label: "Contratos",    icon: <ScrollText size={16} /> },
  { href: "/financeiro",  label: "Financeiro",   icon: <DollarSign size={16} /> },
  { href: "/estoque",     label: "Estoque",      icon: <Package size={16} /> },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "10px 0" : "9px 12px",
        borderRadius: 8,
        marginBottom: 1,
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? "#FFFFFF" : "rgba(255,255,255,0.50)",
        fontSize: "0.78rem",
        fontFamily: "var(--font-body)",
        fontWeight: active ? 600 : 400,
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
        position: "relative",
        borderLeft: active ? "2px solid #1F7A4D" : "2px solid transparent",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)";
        }
      }}
    >
      <span style={{ flexShrink: 0, color: active ? "#1F7A4D" : "inherit" }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Fecha no mobile ao navegar
  useEffect(() => { onClose?.(); }, [pathname]); // eslint-disable-line

  const width = collapsed ? 64 : 248;

  function isActive(item: NavItem) {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      <aside
        className="sidebar-panel fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300"
        style={{
          width,
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "18px 0" : "16px 16px 16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          {/* Badge F */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "#1F7A4D",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF",
              fontFamily: "var(--font-display)",
            }}>
              F
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "#FFFFFF", fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                  Forma & Função
                </div>
                <div style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                  Odontologia
                </div>
              </div>
            )}
          </div>

          {/* Botão colapsar — desktop only */}
          {!collapsed && (
            <button
              className="hidden lg:flex"
              onClick={() => setCollapsed(true)}
              style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6,
                width: 24, height: 24, alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.40)", flexShrink: 0,
              }}
              aria-label="Recolher sidebar"
            >
              <ChevronLeft size={13} />
            </button>
          )}
          {collapsed && (
            <button
              className="hidden lg:flex absolute"
              onClick={() => setCollapsed(false)}
              style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6,
                width: 24, height: 24, alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.40)",
                right: -12, top: 20, zIndex: 1,
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
              aria-label="Expandir sidebar"
            >
              <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}

          {/* Fechar mobile */}
          <button className="lg:hidden" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }} aria-label="Fechar menu">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Nav principal */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed ? "12px 8px" : "12px 10px" }}>
          {NAV_MAIN.map(item => (
            <NavLink key={item.label} item={item} active={isActive(item)} collapsed={collapsed} />
          ))}
        </nav>

        {/* Configurações — fixo na base */}
        <div style={{ padding: collapsed ? "10px 8px" : "10px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <NavLink
            item={{ href: "/configuracoes", label: "Configurações", icon: <Settings size={16} /> }}
            active={pathname.startsWith("/configuracoes")}
            collapsed={collapsed}
          />
        </div>
      </aside>
    </>
  );
}
