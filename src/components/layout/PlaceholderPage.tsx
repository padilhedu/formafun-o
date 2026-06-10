interface PlaceholderPageProps {
  title: string;
  description: string;
  phase?: string;
}

export function PlaceholderPage({ title, description, phase }: PlaceholderPageProps) {
  return (
    <div>
      <div className="mb-8">
        <h1
          className="heading text-3xl text-offwhite mb-1"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {title}
        </h1>
        <p className="text-muted text-sm">{description}</p>
      </div>

      <div
        className="card p-12 text-center"
        style={{ borderStyle: "dashed", borderColor: "rgba(184,154,90,0.2)" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(184,154,90,0.08)", border: "1px solid rgba(184,154,90,0.2)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#B89A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          className="heading text-xl text-offwhite mb-2"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {title}
        </div>
        <p className="text-muted text-sm max-w-md mx-auto">{description}</p>
        {phase && (
          <div
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
            style={{ background: "rgba(184,154,90,0.08)", border: "1px solid rgba(184,154,90,0.2)" }}
          >
            <span className="text-gold text-xs font-semibold uppercase tracking-wider">{phase}</span>
          </div>
        )}
      </div>
    </div>
  );
}
