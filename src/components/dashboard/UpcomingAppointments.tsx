const APPOINTMENTS = [
  { time: "08:30", name: "Ana Paula Ferreira", proc: "Avaliação", status: "confirmado" },
  { time: "09:00", name: "Marcos Silveira", proc: "Canal · #46", status: "confirmado" },
  { time: "10:00", name: "Cláudia Mendes", proc: "Clareamento", status: "agendado" },
  { time: "11:00", name: "Roberto Alves", proc: "Consulta de retorno", status: "agendado" },
  { time: "14:00", name: "Fernanda Costa", proc: "Instalação Prótese", status: "confirmado" },
  { time: "15:30", name: "João Pedro Lima", proc: "Profilaxia", status: "agendado" },
  { time: "17:00", name: "Marina Souza", proc: "Bracket · Manutenção", status: "agendado" },
];

const STATUS_STYLE: Record<string, { color: string; label: string; bg: string }> = {
  confirmado: { color: "#4ADE80", label: "Confirmado", bg: "rgba(74,222,128,0.1)" },
  agendado:   { color: "#FBBF24", label: "Agendado",   bg: "rgba(251,191,36,0.1)" },
  faltou:     { color: "#F87171", label: "Faltou",     bg: "rgba(248,113,113,0.1)" },
};

export function UpcomingAppointments() {
  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: "linear-gradient(145deg, #141416 0%, #111113 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-sm font-semibold"
            style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}
          >
            Agenda de Hoje
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#8A8A93" }}>
            {APPOINTMENTS.length} consultas agendadas
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            color: "#B89A5A",
            background: "rgba(184,154,90,0.1)",
            border: "1px solid rgba(184,154,90,0.2)",
            fontFamily: "var(--font-montserrat)",
          }}
        >
          9 jun
        </span>
      </div>

      <div className="space-y-0">
        {APPOINTMENTS.map((a, i) => {
          const s = STATUS_STYLE[a.status];
          return (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-white/[0.025] rounded-lg px-2 -mx-2 cursor-pointer"
              style={{
                borderBottom: i < APPOINTMENTS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              {/* Time */}
              <div
                className="text-xs font-semibold w-11 flex-shrink-0 tabular-nums text-right"
                style={{ color: "#8A8A93", fontFamily: "var(--font-montserrat)" }}
              >
                {a.time}
              </div>

              {/* Status dot */}
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: s.color, boxShadow: `0 0 4px ${s.color}80` }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-medium truncate"
                  style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}
                >
                  {a.name}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: "#8A8A93", fontSize: "0.7rem" }}>
                  {a.proc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
