"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Box,
  Megaphone,
  Settings,
  TrendingUp,
  Wrench,
  ChevronDown,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "COMERCIAL",
    items: [
      { href: "/dashboard", icon: <BarChart3 size={20} />, label: "Dashboard" },
      { href: "/leads", icon: <TrendingUp size={20} />, label: "Leads" },
      { href: "/orcamentos", icon: <FileText size={20} />, label: "Orçamentos" },
      { href: "/contratos", icon: <FileText size={20} />, label: "Contratos" },
    ],
  },
  {
    title: "CLÍNICO",
    items: [
      { href: "/pacientes", icon: <Users size={20} />, label: "Pacientes" },
      { href: "/agenda", icon: <Calendar size={20} />, label: "Agenda" },
    ],
  },
  {
    title: "FINANCEIRO",
    items: [
      { href: "/financeiro", icon: <DollarSign size={20} />, label: "Financeiro" },
      { href: "/financeiro/receber", icon: <DollarSign size={20} />, label: "Receber" },
      { href: "/financeiro/pagar", icon: <DollarSign size={20} />, label: "Pagar" },
    ],
  },
  {
    title: "OPERACIONAL",
    items: [
      { href: "/estoque", icon: <Box size={20} />, label: "Estoque" },
      { href: "/protese", icon: <Wrench size={20} />, label: "Prótese" },
      { href: "/marketing", icon: <Megaphone size={20} />, label: "Marketing" },
      { href: "/configuracoes", icon: <Settings size={20} />, label: "Configurações" },
    ],
  },
];

interface SidebarMinimalProps {
  onLogout?: () => void;
}

export function SidebarMinimal({ onLogout }: SidebarMinimalProps) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Encontrar qual grupo está ativo
  const currentGroupTitle = NAV_GROUPS.find((g) =>
    g.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.title;

  return (
    <>
      {/* Sidebar — 56px preta com ícones */}
      <aside
        className="fixed left-0 top-0 h-screen w-14 bg-bg-sidebar flex flex-col items-center py-4 border-r z-50"
        style={{
          background: "var(--color-bg-sidebar)",
          borderRightColor: "var(--sidebar-border)",
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-accent-soft transition-colors duration-200"
          style={{
            background: "var(--color-accent-soft)",
            color: "var(--color-accent)",
          }}
          title="Forma & Função"
        >
          <span className="text-xs font-bold">FF</span>
        </div>

        {/* Separador */}
        <div className="w-6 h-px" style={{ background: "var(--sidebar-border)" }} />

        {/* Navegação — botões de grupo */}
        <nav className="flex flex-col gap-2 flex-1">
          {NAV_GROUPS.map((group) => (
            <button
              key={group.title}
              onClick={() => setActiveGroup(activeGroup === group.title ? null : group.title)}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group"
              style={{
                background:
                  currentGroupTitle === group.title
                    ? "var(--color-accent-soft)"
                    : "transparent",
              }}
              onMouseEnter={() => setHoveredItem(group.title)}
              onMouseLeave={() => setHoveredItem(null)}
              title={group.title}
            >
              {/* Icon — primavera da navegação */}
              <div
                style={{
                  color:
                    currentGroupTitle === group.title
                      ? "var(--color-accent)"
                      : "var(--color-text-on-sidebar)",
                  transition: "color 0.15s",
                }}
              >
                {group.items[0]?.icon}
              </div>

              {/* Tooltip — aparece em hover */}
              {hoveredItem === group.title && (
                <div
                  className="absolute left-full ml-3 px-2 py-1 rounded-md text-xs font-medium text-left whitespace-nowrap z-50"
                  style={{
                    background: "var(--color-bg-sidebar)",
                    color: "var(--color-text-on-sidebar)",
                    border: "1px solid var(--sidebar-border)",
                  }}
                >
                  {group.title}
                </div>
              )}

              {/* Indicador de grupo ativo — ponto à direita */}
              {currentGroupTitle === group.title && (
                <div
                  className="absolute right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Separador antes do logout */}
        <div className="w-6 h-px" style={{ background: "var(--sidebar-border)" }} />

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-error-soft"
          style={{
            color: "var(--color-text-on-sidebar)",
          }}
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </aside>

      {/* Popover Menu — items do grupo ativo */}
      {activeGroup && (
        <div
          className="fixed left-14 top-4 w-48 bg-bg-surface rounded-lg shadow-lg z-50 overflow-hidden border"
          style={{
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="px-4 py-3 text-xs font-bold uppercase tracking-widest"
            style={{
              color: "var(--color-text-muted)",
              borderBottomColor: "var(--color-divider)",
              borderBottomWidth: "1px",
            }}
          >
            {activeGroup}
          </div>

          <nav className="py-2">
            {NAV_GROUPS.find((g) => g.title === activeGroup)?.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-150"
                  style={{
                    color: active
                      ? "var(--color-accent)"
                      : "var(--color-text-primary)",
                    background: active ? "var(--color-accent-soft)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--color-bg-muted)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = active
                      ? "var(--color-accent-soft)"
                      : "transparent";
                  }}
                >
                  <span
                    style={{
                      color: active
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Overlay para fechar popover ao clicar fora */}
      {activeGroup && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setActiveGroup(null)}
        />
      )}
    </>
  );
}
