import type { ReactNode } from 'react';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-cormorant' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-montserrat' });

export const metadata = { title: 'Portal do Paciente — Forma & Função' };

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body style={{ background: '#F5F3EF', color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', margin: 0, padding: 0, minHeight: '100vh' }}>
        {/* Portal header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '0 20px',
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-cormorant)', color: '#1F7A4D', fontWeight: 600, fontSize: '1.2rem' }}>
                Forma & Função
              </span>
              <span style={{ fontSize: 11, color: '#6B6B66', marginLeft: 8, fontFamily: 'var(--font-montserrat)' }}>Portal do Paciente</span>
            </div>
            <form method="POST" action="/api/portal/logout">
              <button type="submit" style={{
                fontSize: 12, color: '#6B6B66', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-montserrat)',
              }}>
                Sair
              </button>
            </form>
          </div>
        </header>

        <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 48px' }}>
          {children}
        </main>

        <footer style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 10, color: 'rgba(138,138,147,0.4)', fontFamily: 'var(--font-montserrat)' }}>
            Seus dados são protegidos conforme a LGPD. © Forma &amp; Função Odontologia.
          </p>
        </footer>
      </body>
    </html>
  );
}
