import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function sb() {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => c.getAll(), setAll: () => {} } }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await sb();
  const body = await req.json();

  const campos: Record<string, unknown> = {};
  const permitidos = ['titulo','descricao','tipo','status','inicio','fim','cor',
                      'paciente_id','dentista_id','whatsapp_enviado','whatsapp_confirmado'];
  for (const k of permitidos) {
    if (k in body) campos[k] = body[k];
  }

  const { data, error } = await client
    .from('agenda_eventos').update(campos).eq('id', id)
    .select('*, pacientes(nome, telefone)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await sb();
  const { error } = await client.from('agenda_eventos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
