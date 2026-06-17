'use client';

import { useState } from 'react';

interface Integration {
  id: string; nome: string; descricao: string; envVar: string; docUrl?: string;
}

const INTEGRACOES: Integration[] = [
  { id: 'vindi',    nome: 'Vindi',    descricao: 'Gateway de pagamentos e assinaturas', envVar: 'VINDI_API_KEY' },
  { id: 'zapsign',  nome: 'ZapSign',  descricao: 'Assinatura digital de contratos e TCLEs', envVar: 'ZAPSIGN_API_TOKEN' },
  { id: 'whatsapp', nome: 'WhatsApp', descricao: 'Notificações via Z-API / Evolution API', envVar: 'WHATSAPP_API_TOKEN' },
  { id: 'drive',    nome: 'Google Drive', descricao: 'Armazenamento de prontuários e documentos', envVar: 'GOOGLE_OAUTH_CLIENT_ID' },
];

export function TabIntegracoes() {
  const [testando, setTestando] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, 'ok' | 'erro' | 'dev'>>({});

  async function testarConexao(id: string) {
    setTestando(id);
    try {
      const res = await fetch(`/api/integracoes/${id}/status`);
      const data = await res.json();
      setResultados(prev => ({ ...prev, [id]: data.status === 'ok' ? 'ok' : data.status === 'dev' ? 'dev' : 'erro' }));
    } catch {
      setResultados(prev => ({ ...prev, [id]: 'erro' }));
    } finally {
      setTestando(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Integrações</h2>

      <div className="card p-4" style={{ background: 'rgba(96,165,250,0.04)', borderColor: 'rgba(96,165,250,0.15)' }}>
        <p className="text-muted text-xs">As chaves de API são gerenciadas via variáveis de ambiente no servidor e não são exibidas aqui por segurança. Configure-as no painel da Vercel.</p>
      </div>

      <div className="space-y-3">
        {INTEGRACOES.map(int => {
          const status = resultados[int.id];
          return (
            <div key={int.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#1F7A4D', fontSize: 13,
                  }}>
                    {int.nome[0]}
                  </div>
                  <div>
                    <div className="text-offwhite font-medium text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>{int.nome}</div>
                    <div className="text-muted text-xs">{int.descricao}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {status && (
                    <span className="badge" style={{
                      fontSize: 10,
                      background: status === 'ok' ? 'rgba(74,222,128,0.1)' : status === 'dev' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                      color: status === 'ok' ? '#1F7A4D' : status === 'dev' ? '#C98A1E' : '#C0392B',
                      border: `1px solid ${status === 'ok' ? 'rgba(74,222,128,0.3)' : status === 'dev' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`,
                    }}>
                      {status === 'ok' ? '✓ Conectado' : status === 'dev' ? '⚡ Modo Dev' : '✗ Erro'}
                    </span>
                  )}
                  <button
                    onClick={() => testarConexao(int.id)}
                    disabled={testando === int.id}
                    className="btn-ghost"
                    style={{ padding: '5px 14px', fontSize: 11 }}
                  >
                    {testando === int.id ? 'Testando...' : 'Testar conexão'}
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="text-muted text-xs">Variável:</span>
                  <code style={{ fontSize: 11, color: '#6B6B66', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                    {int.envVar}=••••••••••••
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
