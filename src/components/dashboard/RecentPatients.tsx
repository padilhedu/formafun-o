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
    <div
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(145deg, #141416 0%, #111113 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}>
            Últimos Atendimentos
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#8A8A93" }}>5 mais recentes</p>
        </div>
        <a
          href="/pacientes"
          className="text-xs font-semibold transition-colors duration-150 hover:opacity-80"
          style={{ color: "#B89A5A", fontFamily: "var(--font-montserrat)" }}
        >
          Ver todos →
        </a>
      </div>
      <div className="space-y-0">
        {PATIENTS.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-3 transition-colors duration-150 hover:bg-white/[0.025] rounded-lg px-2 -mx-2 cursor-pointer"
            style={{
              borderBottom: i < PATIENTS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            <Avatar name={p.name} />
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: "#F5F2EA", fontFamily: "var(--font-montserrat)" }}
              >
                {p.name}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: "#8A8A93" }}>{p.proc}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs" style={{ color: "#8A8A93" }}>{p.last}</div>
              <div
                className="text-xs font-semibold mt-0.5"
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
