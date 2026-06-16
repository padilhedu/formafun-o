import { NextResponse } from 'next/server';

// Integração ZapSign desativada — endpoint descomissionado.
export async function POST() {
  return NextResponse.json({ error: 'Integração desativada.' }, { status: 410 });
}
