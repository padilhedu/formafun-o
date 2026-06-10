import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function supabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

// PATCH /api/agenda/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabase();
  const body = await req.json();

  const campos: Record<string, unknown> = {};
  const permitidos = ['titulo', 'descricao', 'tipo', 'status', 'inicio', 'fim', 'cor',
                      'paciente_id', 'dentista_id', 'whatsapp_enviado', 'whatsapp_confirmado'];
  for (const k of permitidos) {
    if (k in body) campos[k] = body[k];
  }

  const { data, error } = await sb
    .from('agenda_eventos')
    .update(campos)
    .eq('id', params.id)
    .select('*, pacientes(nome, telefone)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/agenda/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabase();
  const { error } = await sb.from('agenda_eventos').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
