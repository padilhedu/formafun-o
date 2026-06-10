const APPOINTMENTS = [
  { time: "08:30", name: "Ana Paula Ferreira", proc: "Avaliação", status: "confirmado" },
  { time: "09:00", name: "Marcos Silveira", proc: "Canal · #46", status: "confirmado" },
  { time: "10:00", name: "Cláudia Mendes", proc: "Clareamento", status: "agendado" },
  { time: "11:00", name: "Roberto Alves", proc: "Consulta de retorno", status: "agendado" },
  { time: "14:00", name: "Fernanda Costa", proc: "Instalação Prótese", status: "confirmado" },
  { time: "15:30", name: "João Pedro Lima", proc: "Profilaxia", status: "agendado" },
  { time: "17:00", name: "Marina Souza", proc: "Bracket · Manutenção", status: "agendado" },
];

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  confirmado: { color: "#4ADE80", label: "Confirmado" },
  agendado: { color: "#FBBF24", label: "Agendado" },
  faltou: { color: "#F87171", label: "Faltou" },
};

export function UpcomingAppointments() {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-offwhite font-semibold text-sm">Agenda de Hoje</h2>
        <span className="text-gold text-xs font-medium">9 jun</span>
      </div>
      <div className="space-y-0.5">
        {APPOINTMENTS.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 table-row-hover rounded-lg px-2 -mx-2"
          >
            <div
              className="text-xs font-semibold w-10 flex-shrink-0 text-right"
              style={{ color: "#8A8A93", fontFamily: "var(--font-montserrat)" }}
            >
              {a.time}
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: STATUS_STYLE[a.status].color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-offwhite text-xs font-medium truncate">{a.name}</div>
              <div className="text-muted truncate" style={{ fontSize: "0.65rem" }}>{a.proc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
