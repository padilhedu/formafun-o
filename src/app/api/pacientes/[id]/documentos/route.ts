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

  // Upload via service role (bypassa RLS no storage.objects)
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const storagePath = `pacientes/${id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await admin.storage
    .from('documentos')
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  // Salva o path (não a URL pública) — signed URL gerada server-side ao carregar
  const pathToStore = uploadError ? null : storagePath;

  const { data, error } = await supabase
    .from('documentos_paciente')
    .insert({
      paciente_id: id,
      tipo,
      nome: file.name,
      drive_link: pathToStore,
      mime_type: file.type,
      criado_por: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
