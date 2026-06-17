/**
 * Utilitários de data para America/Sao_Paulo (BRT, UTC-3, sem horário de verão desde 2019).
 * Todas as datas são armazenadas como UTC no banco; exibidas sempre em BRT.
 * Funciona corretamente tanto no servidor Vercel (UTC) quanto no browser.
 */

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3 em milissegundos

/** Retorna 'YYYY-MM-DD' no fuso BRT para qualquer Date ou ISO UTC */
export function dataBRT(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const brt = new Date(date.getTime() - BRT_OFFSET_MS);
  const y = brt.getUTCFullYear();
  const m = String(brt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(brt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Retorna 'HH:mm' no fuso BRT */
export function formatarHoraBRT(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const brt = new Date(date.getTime() - BRT_OFFSET_MS);
  const h = String(brt.getUTCHours()).padStart(2, '0');
  const mi = String(brt.getUTCMinutes()).padStart(2, '0');
  return `${h}:${mi}`;
}

/** Minutos desde meia-noite BRT — para calcular posição vertical no grid da agenda */
export function minutosNoDiaBRT(d: Date | string): number {
  const date = typeof d === 'string' ? new Date(d) : d;
  const brt = new Date(date.getTime() - BRT_OFFSET_MS);
  return brt.getUTCHours() * 60 + brt.getUTCMinutes();
}

/** Hoje como 'YYYY-MM-DD' em BRT */
export function hojeBRT(): string {
  return dataBRT(new Date());
}

/**
 * Intervalo UTC (ISO strings) da semana segunda–domingo em BRT que contém `ref`.
 * Funciona corretamente mesmo quando chamado do servidor Vercel (UTC).
 */
export function semanaUTCPorBRT(ref: Date = new Date()): { inicioISO: string; fimISO: string } {
  const brtStr = dataBRT(ref);
  // Segunda-feira 00:00 BRT = segunda-feira 03:00 UTC
  const refMidnightBRT = new Date(`${brtStr}T00:00:00-03:00`);
  const dow = refMidnightBRT.getUTCDay(); // 0=Dom, 1=Seg
  const diffParaSeg = dow === 0 ? -6 : 1 - dow;

  const seg = new Date(refMidnightBRT);
  seg.setUTCDate(seg.getUTCDate() + diffParaSeg);
  // seg = segunda 00:00 BRT = segunda 03:00 UTC

  const dom = new Date(seg);
  dom.setUTCDate(dom.getUTCDate() + 7);
  dom.setTime(dom.getTime() - 1);
  // dom = domingo 23:59:59.999 BRT = segunda próxima 02:59:59.999 UTC

  return { inicioISO: seg.toISOString(), fimISO: dom.toISOString() };
}

/**
 * Converte input de datetime-local ("YYYY-MM-DDTHH:mm") para ISO UTC,
 * assumindo que o horário representa BRT (America/Sao_Paulo, UTC-3).
 * Evita ambiguidade de fuso do browser.
 */
export function localInputParaUTC(localStr: string): string {
  if (!localStr) return '';
  // Append explicit BRT offset so new Date() interprets corretamente
  const normalized = localStr.length === 16 ? localStr + ':00' : localStr;
  return new Date(`${normalized}-03:00`).toISOString();
}

/**
 * Converte ISO UTC para "YYYY-MM-DDTHH:mm" em BRT (para uso em inputs datetime-local).
 */
export function utcParaLocalInput(utcIso: string): string {
  if (!utcIso) return '';
  const date = new Date(utcIso);
  const brt = new Date(date.getTime() - BRT_OFFSET_MS);
  const y = brt.getUTCFullYear();
  const mo = String(brt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(brt.getUTCDate()).padStart(2, '0');
  const h = String(brt.getUTCHours()).padStart(2, '0');
  const mi = String(brt.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}:${mi}`;
}
