const PATIENTS = [
  { name: "Ana Paula Ferreira", last: "07/06/2026", proc: "Avaliação inicial", status: "ativo" },
  { name: "Marcos Silveira",    last: "06/06/2026", proc: "Tratamento de canal", status: "ativo" },
  { name: "Cláudia Mendes",     last: "05/06/2026", proc: "Clareamento dental", status: "ativo" },
  { name: "Roberto Alves",      last: "04/06/2026", proc: "Consulta de retorno", status: "ativo" },
  { name: "Fernanda Costa",     last: "03/06/2026", proc: "Instalação de prótese", status: "inativo" },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{
        background: "rgba(31,122,77,0.10)",
        border: "1px solid rgba(31,122,77,0.2)",
        color: "#1F7A4D",
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
        <h2 className="font-semibold text-sm" style={{ color: "#1C1C1C", fontFamily: "var(--font-montserrat)" }}>
          Últimos Atendimentos
        </h2>
        <a href="/pacientes" style={{ color: "#1F7A4D", fontSize: "0.75rem", fontFamily: "var(--font-montserrat)", fontWeight: 600, textDecoration: "none" }}>
          Ver todos →
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
              <div className="text-xs font-medium truncate" style={{ color: "#1C1C1C", fontFamily: "var(--font-montserrat)" }}>{p.name}</div>
              <div className="truncate" style={{ fontSize: "0.65rem", color: "#9B9BA0", fontFamily: "var(--font-montserrat)" }}>{p.proc}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div style={{ fontSize: "0.65rem", color: "#9B9BA0", fontFamily: "var(--font-montserrat)" }}>{p.last}</div>
              <div
                className="text-xs font-medium mt-0.5"
                style={{ color: p.status === "ativo" ? "#1F7A4D" : "#9B9BA0", fontFamily: "var(--font-montserrat)" }}
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
