import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const tipo = (formData.get('tipo') as string) || 'outro';

  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 });

  // Upload para Supabase Storage como fallback (Drive na Fase 2 completa)
  const path = `pacientes/${id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(path, file, { contentType: file.type, upsert: false });

  let publicUrl: string | null = null;
  if (!uploadError) {
    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
    publicUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('documentos_paciente')
    .insert({
      paciente_id: id,
      tipo,
      nome: file.name,
      drive_link: publicUrl,
      mime_type: file.type,
      criado_por: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
