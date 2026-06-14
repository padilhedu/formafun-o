'use client';

import { useState } from 'react';
import { TabClinica } from './tabs/TabClinica';
import { TabProfissionais } from './tabs/TabProfissionais';
import { TabAgenda } from './tabs/TabAgenda';
import { TabFinanceiro } from './tabs/TabFinanceiro';
import { TabProcedimentos } from './tabs/TabProcedimentos';
import { TabUsuarios } from './tabs/TabUsuarios';
import { TabSeguranca } from './tabs/TabSeguranca';
import { TabIntegracoes } from './tabs/TabIntegracoes';
import { TabDocumentos } from './tabs/TabDocumentos';

const TABS = [
  { id: 'clinica',        label: 'Clínica' },
  { id: 'profissionais',  label: 'Profissionais' },
  { id: 'agenda',         label: 'Agenda' },
  { id: 'financeiro',     label: 'Financeiro' },
  { id: 'procedimentos',  label: 'Procedimentos' },
  { id: 'documentos',     label: 'Documentos' },
  { id: 'usuarios',       label: 'Usuários' },
  { id: 'seguranca',      label: 'Segurança' },
  { id: 'integracoes',    label: 'Integrações' },
] as const;

type TabId = typeof TABS[number]['id'];

interface Props {
  config: Record<string, unknown>;
  profissionais: unknown[];
  procedimentos: unknown[];
  usuarios: unknown[];
  auditLog: unknown[];
  userEmail: string;
}

export function ConfiguracoesClient({ config, profissionais, procedimentos, usuarios, auditLog }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('clinica');

  return (
    <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
      {/* Sidebar nav */}
      <nav className="card" style={{ width: 200, flexShrink: 0, padding: '8px 0' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 16px', fontSize: 13,
              fontFamily: 'var(--font-montserrat)', fontWeight: activeTab === tab.id ? 600 : 400,
              background: activeTab === tab.id ? 'rgba(184,154,90,0.1)' : 'transparent',
              color: activeTab === tab.id ? '#B89A5A' : '#8A8A93',
              border: 'none', cursor: 'pointer',
              borderLeft: activeTab === tab.id ? '3px solid #B89A5A' : '3px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === 'clinica'       && <TabClinica config={config} />}
        {activeTab === 'profissionais' && <TabProfissionais profissionais={profissionais as ProfissionalRow[]} />}
        {activeTab === 'agenda'        && <TabAgenda config={config} />}
        {activeTab === 'financeiro'    && <TabFinanceiro config={config} />}
        {activeTab === 'procedimentos' && <TabProcedimentos procedimentos={procedimentos as ProcedimentoRow[]} />}
        {activeTab === 'documentos'    && <TabDocumentos />}
        {activeTab === 'usuarios'      && <TabUsuarios usuarios={usuarios as UsuarioRow[]} />}
        {activeTab === 'seguranca'     && <TabSeguranca auditLog={auditLog as AuditRow[]} />}
        {activeTab === 'integracoes'   && <TabIntegracoes />}
      </div>
    </div>
  );
}

// Type shims used by children (full types live in each tab file)
export interface ProfissionalRow {
  id: string; nome: string; cro?: string; especialidade?: string;
  cor?: string; comissao_percentual?: number; ativo: boolean; criado_em: string;
}
export interface ProcedimentoRow {
  id: string; codigo?: string; nome: string; categoria?: string;
  valor_base?: number; duracao_min?: number; ativo: boolean;
}
export interface UsuarioRow {
  id: string; role: string; nome?: string; created_at?: string;
}
export interface AuditRow {
  id: string; usuario_email?: string; acao: string; tabela?: string;
  registro_id?: string; criado_em: string;
}
