import type { Paciente, Anamnese, Evolucao } from '@/types/pacientes';
import { formatDate } from '@/lib/masks';

interface Props { paciente: Paciente; anamnese: Anamnese | null; evolucoes: Evolucao[]; }

export function AbaVisaoGeral({ paciente, anamnese, evolucoes }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Dados pessoais */}
      <div className="xl:col-span-2 space-y-4">
        <InfoCard title="Dados Pessoais">
          <Grid2>
            <InfoItem label="Nome completo" value={paciente.nome} />
            <InfoItem label="CPF" value={paciente.cpf} />
            <InfoItem label="RG" value={paciente.rg} />
            <InfoItem label="Data de nascimento" value={formatDate(paciente.data_nascimento)} />
            <InfoItem label="Sexo" value={paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Feminino' : paciente.sexo} />
            <InfoItem label="Convênio" value={paciente.convenio} />
          </Grid2>
        </InfoCard>

        <InfoCard title="Contato">
          <Grid2>
            <InfoItem label="Telefone" value={paciente.telefone} />
            <InfoItem label="WhatsApp" value={paciente.whatsapp} />
            <InfoItem label="E-mail" value={paciente.email} span2 />
            {paciente.endereco?.logradouro && (
              <InfoItem label="Endereço" span2
                value={`${paciente.endereco.logradouro}, ${paciente.endereco.numero ?? ''} ${paciente.endereco.complemento ?? ''} — ${paciente.endereco.bairro ?? ''}, ${paciente.endereco.cidade ?? ''}/${paciente.endereco.estado ?? ''}`} />
            )}
          </Grid2>
        </InfoCard>

        {/* Últimas evoluções */}
        <div style={{ borderRadius: 14, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-offwhite font-semibold text-sm">Últimas Evoluções</h3>
            <a href="?aba=evolucoes" className="text-gold text-xs hover:text-champagne transition-colors">Ver todas →</a>
          </div>
          {evolucoes.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma evolução registrada.</p>
          ) : (
            <div className="space-y-2">
              {evolucoes.slice(0, 3).map(ev => (
                <div key={ev.id} className="flex items-start gap-3 py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: ev.travada ? '#8A8A93' : '#4ADE80' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-offwhite text-xs font-medium">{ev.procedimento}</span>
                      {ev.dente && <span className="text-muted text-xs">· Dente {ev.dente}</span>}
                      {ev.travada && (
                        <span className="badge text-[0.6rem]"
                          style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>
                          Travado
                        </span>
                      )}
                    </div>
                    {ev.descricao && <p className="text-muted text-xs mt-0.5 truncate">{ev.descricao}</p>}
                  </div>
                  <span className="text-muted text-xs flex-shrink-0">{formatDate(ev.data)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lateral */}
      <div className="space-y-4">
        <InfoCard title="Informações">
          <div className="space-y-3">
            <InfoItem label="Como conheceu" value={paciente.indicacao_origem} />
            <InfoItem label="Cadastro" value={formatDate(paciente.created_at)} />
            <InfoItem label="LGPD" value={paciente.consentimento_lgpd_em ? `Assinado em ${formatDate(paciente.consentimento_lgpd_em)}` : 'Pendente'} />
          </div>
        </InfoCard>

        {anamnese && anamnese.alertas.length > 0 && (
          <div style={{ borderRadius: 14, background: 'linear-gradient(145deg, rgba(248,113,113,0.05) 0%, #111113 100%)', border: '1px solid rgba(248,113,113,0.18)', borderLeft: '3px solid #F87171', padding: '16px' }}>
            <h3 className="text-error text-xs font-semibold uppercase tracking-wider mb-3">Alertas Clínicos</h3>
            <div className="space-y-1.5">
              {anamnese.alertas.map(a => (
                <div key={a} className="flex items-center gap-2 text-xs" style={{ color: '#F87171' }}>
                  <span>⚠</span><span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paciente.observacoes && (
          <InfoCard title="Observações">
            <p className="text-muted text-sm leading-relaxed">{paciente.observacoes}</p>
          </InfoCard>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 14,
      background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '20px',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8A8A93',
        borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

function InfoItem({ label, value, span2 }: { label: string; value?: string | null; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <div className="text-muted text-xs uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-offwhite text-sm">{value || '—'}</div>
    </div>
  );
}
