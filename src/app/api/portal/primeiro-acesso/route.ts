import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { codigo, cpf, senha } = await req.json();
  if (!codigo || !cpf || !senha) return NextResponse.json({ error: 'Todos os campos obrigatórios' }, { status: 400 });
  if (senha.length < 8) return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 });

  const sb = await createClient();

  // Verify invite code + CPF match
  const { data: acesso } = await sb
    .from('portal_acessos')
    .select('id, paciente_id, convite_usado, pacientes(cpf, email)')
    .eq('codigo_convite', codigo.trim().toUpperCase())
    .eq('habilitado', true)
    .single();

  if (!acesso) return NextResponse.json({ error: 'Código de convite inválido' }, { status: 400 });
  if (acesso.convite_usado) return NextResponse.json({ error: 'Este código já foi utilizado' }, { status: 400 });

  const paciente = acesso.pacientes as unknown as { cpf: string | null; email: string | null } | null;
  const cpfLimpo = cpf.replace(/\D/g, '');
  const pacienteCpfLimpo = (paciente?.cpf ?? '').replace(/\D/g, '');
  if (cpfLimpo !== pacienteCpfLimpo) return NextResponse.json({ error: 'CPF não corresponde' }, { status: 400 });

  const pacienteEmail = paciente?.email;
  if (!pacienteEmail) return NextResponse.json({ error: 'Paciente sem e-mail cadastrado — contate a clínica' }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 });

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create user account
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email: pacienteEmail,
    password: senha,
    user_metadata: { role: 'paciente' },
    email_confirm: true,
  });

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

  // Link user to paciente
  await admin.from('portal_acessos').update({
    user_id: newUser.user!.id,
    convite_usado: true,
  }).eq('id', acesso.id);

  // Sign in automatically
  const { error: signInErr } = await sb.auth.signInWithPassword({ email: pacienteEmail, password: senha });
  if (signInErr) return NextResponse.json({ error: 'Conta criada. Faça login.' }, { status: 200 });

  return NextResponse.json({ ok: true });
}
