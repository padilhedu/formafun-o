const PATIENTS = [
  { name: "Ana Paula Ferreira", last: "07/06/2026", proc: "Avaliação inicial", status: "ativo" },
  { name: "Marcos Silveira", last: "06/06/2026", proc: "Tratamento de canal", status: "ativo" },
  { name: "Cláudia Mendes", last: "05/06/2026", proc: "Clareamento dental", status: "ativo" },
  { name: "Roberto Alves", last: "04/06/2026", proc: "Consulta de retorno", status: "ativo" },
  { name: "Fernanda Costa", last: "03/06/2026", proc: "Instalação de prótese", status: "inativo" },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{
        background: "rgba(184,154,90,0.12)",
        border: "1px solid rgba(184,154,90,0.2)",
        color: "#B89A5A",
        fontFamily: "var(--font-montserrat)",
      }}
    >
      {initials}
    </div>
  );
}

export function RecentPatients() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-offwhite font-semibold text-sm">Últimos Atendimentos</h2>
        <a href="/pacientes" className="text-gold text-xs font-medium hover:text-champagne transition-colors">
          Ver todos
        </a>
      </div>
      <div className="space-y-0.5">
        {PATIENTS.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 table-row-hover rounded-lg px-2 -mx-2"
          >
            <Avatar name={p.name} />
            <div className="flex-1 min-w-0">
              <div className="text-offwhite text-xs font-medium truncate">{p.name}</div>
              <div className="text-muted truncate" style={{ fontSize: "0.65rem" }}>{p.proc}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-muted" style={{ fontSize: "0.65rem" }}>{p.last}</div>
              <div
                className="text-xs font-medium mt-0.5"
                style={{ color: p.status === "ativo" ? "#4ADE80" : "#8A8A93" }}
              >
                {p.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
