import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, calcAge } from '@/lib/masks';
import type { Paciente } from '@/types/pacientes';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

const PER_PAGE = 20;

export default async function PacientesPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? '';
  const status = params.status ?? 'ativo';
  const page = Math.max(1, parseInt(params.page ?? '1'));

  let pacientes: Paciente[] = [];
  let total = 0;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    let query = supabase
      .from('pacientes')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('nome');

    if (status !== 'todos') query = query.eq('status', status);
    if (q) query = query.or(`nome.ilike.%${q}%,cpf.ilike.%${q}%,telefone.ilike.%${q}%,email.ilike.%${q}%`);

    query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    const { data, count } = await query;
    pacientes = (data as Paciente[]) ?? [];
    total = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Pacientes
          </h1>
          <p className="text-muted text-sm">{total} paciente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/pacientes/novo" className="btn-primary">
          + Novo Paciente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <form className="flex-1 flex gap-3" method="GET">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome, CPF, telefone ou e-mail..."
              className="input-field pl-9"
            />
          </div>
          <select name="status" defaultValue={status}
            className="input-field w-36"
            style={{ background: '#1A1A1E' }}>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="todos">Todos</option>
          </select>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Paciente', 'CPF', 'Contato', 'Idade', 'Origem', 'Status', ''].map(col => (
                <th key={col} className="table-header text-left px-4 py-3">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-16 text-sm">
                  {q ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
                </td>
              </tr>
            ) : pacientes.map((p) => (
              <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar nome={p.nome} />
                    <div>
                      <div className="text-offwhite text-sm font-medium">{p.nome}</div>
                      {p.email && <div className="text-muted text-xs">{p.email}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted text-sm">{p.cpf ?? '—'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="text-offwhite">{p.telefone ?? p.whatsapp ?? '—'}</div>
                </td>
                <td className="px-4 py-3 text-muted text-sm">
                  {p.data_nascimento ? `${calcAge(p.data_nascimento)} anos` : '—'}
                </td>
                <td className="px-4 py-3 text-muted text-sm">{p.indicacao_origem ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="badge" style={{
                    background: p.status === 'ativo' ? 'rgba(74,222,128,0.1)' : 'rgba(138,138,147,0.1)',
                    color: p.status === 'ativo' ? '#4ADE80' : '#8A8A93',
                    border: `1px solid ${p.status === 'ativo' ? 'rgba(74,222,128,0.25)' : 'rgba(138,138,147,0.15)'}`,
                  }}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/pacientes/${p.id}`}
                    className="text-gold text-xs font-medium hover:text-champagne transition-colors">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-muted text-xs">
              Página {page} de {totalPages} · {total} resultados
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?q=${q}&status=${status}&page=${page - 1}`} className="btn-ghost text-xs py-1 px-3">
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link href={`?q=${q}&status=${status}&page=${page + 1}`} className="btn-ghost text-xs py-1 px-3">
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ nome }: { nome: string }) {
  const initials = nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: 'rgba(184,154,90,0.12)', border: '1px solid rgba(184,154,90,0.2)', color: '#B89A5A', fontFamily: 'var(--font-montserrat)' }}>
      {initials}
    </div>
  );
}
