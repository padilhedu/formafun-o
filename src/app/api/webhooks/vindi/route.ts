import { NextResponse } from 'next/server';

// Integração Vindi desativada — endpoint descomissionado.
export async function POST() {
  return NextResponse.json({ error: 'Integração desativada.' }, { status: 410 });
}
