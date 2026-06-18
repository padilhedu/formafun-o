import type { ContratoStatus } from '@/types/contratos';

const STEPS: { status: ContratoStatus; label: string; icon: string }[] = [
  { status: 'rascunho',    label: 'Gerado',     icon: '📄' },
  { status: 'enviado',     label: 'Enviado',     icon: '📤' },
  { status: 'visualizado', label: 'Visualizado', icon: '👁' },
  { status: 'assinado',    label: 'Assinado',    icon: '✅' },
];

const STEP_ORDER = ['rascunho', 'enviado', 'visualizado', 'assinado'];

interface Props {
  status: ContratoStatus;
  enviadoEm: string | null;
  assinadoEm: string | null;
}

function formatDT(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ContratoTimeline({ status, enviadoEm, assinadoEm }: Props) {
  const currentStep = STEP_ORDER.indexOf(status);
  const isTerminal = status === 'recusado' || status === 'cancelado';

  return (
    <div className="card" style={{ padding: 20 }}>
      <p className="text-muted mb-4" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Status do Documento
      </p>

      {isTerminal ? (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <span style={{ color: '#F87171', fontFamily: 'var(--font-montserrat)', fontSize: 13, fontWeight: 600 }}>
            {status === 'recusado' ? '✕ Recusado' : 'Cancelado'}
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          {STEPS.map((step, idx) => {
            const done = idx <= currentStep;
            const active = idx === currentStep;

            let ts: string | null = null;
            if (step.status === 'enviado') ts = formatDT(enviadoEm);
            if (step.status === 'assinado') ts = formatDT(assinadoEm);

            return (
              <div key={step.status} className="flex items-start gap-3">
                <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: done ? (active && status !== 'assinado' ? 'rgba(31,122,77,0.15)' : 'rgba(74,222,128,0.15)') : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${done ? (active && status !== 'assinado' ? '#1F7A4D' : '#4ADE80') : 'rgba(255,255,255,0.1)'}`,
                      color: done ? (active && status !== 'assinado' ? '#1F7A4D' : '#4ADE80') : '#6B6B66',
                    }}
                  >
                    {done ? (status === 'assinado' || idx < currentStep ? '✓' : '●') : idx + 1}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ width: 1.5, height: 20, background: idx < currentStep ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.07)', margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 4, paddingBottom: 8 }}>
                  <div style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: done ? (active ? '#1C1C1C' : '#6B6B66') : '#6A6A73',
                  }}>
                    {step.label}
                  </div>
                  {ts && <div style={{ fontSize: 10, color: '#6B6B66', marginTop: 2 }}>{ts}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
