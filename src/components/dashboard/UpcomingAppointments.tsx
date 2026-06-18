const APPOINTMENTS = [
  { time: "08:30", name: "Ana Paula Ferreira", proc: "Avaliação",          status: "confirmado" },
  { time: "09:00", name: "Marcos Silveira",    proc: "Canal · #46",        status: "confirmado" },
  { time: "10:00", name: "Cláudia Mendes",     proc: "Clareamento",        status: "agendado"   },
  { time: "11:00", name: "Roberto Alves",      proc: "Consulta de retorno",status: "agendado"   },
  { time: "14:00", name: "Fernanda Costa",     proc: "Instalação Prótese", status: "confirmado" },
  { time: "15:30", name: "João Pedro Lima",    proc: "Profilaxia",         status: "agendado"   },
  { time: "17:00", name: "Marina Souza",       proc: "Bracket · Manutenção",status: "agendado"  },
];

const STATUS_DOT: Record<string, string> = {
  confirmado: "#1F7A4D",
  agendado:   "#C98A1E",
  faltou:     "#C0392B",
};

export function UpcomingAppointments() {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: "#1C1C1C", fontFamily: "var(--font-montserrat)" }}>
          Agenda de Hoje
        </h2>
        <a href="/agenda" style={{ color: "#1F7A4D", fontSize: "0.75rem", fontFamily: "var(--font-montserrat)", fontWeight: 600, textDecoration: "none" }}>
          Ver tudo →
        </a>
      </div>
      <div className="space-y-0.5">
        {APPOINTMENTS.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 table-row-hover rounded-lg px-2 -mx-2"
          >
            <div
              className="text-xs font-semibold w-10 flex-shrink-0 text-right tabular-nums"
              style={{ color: "#9B9BA0", fontFamily: "var(--font-montserrat)" }}
            >
              {a.time}
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: STATUS_DOT[a.status] ?? "#9B9BA0" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "#1C1C1C", fontFamily: "var(--font-montserrat)" }}>{a.name}</div>
              <div className="truncate" style={{ fontSize: "0.65rem", color: "#9B9BA0", fontFamily: "var(--font-montserrat)" }}>{a.proc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
