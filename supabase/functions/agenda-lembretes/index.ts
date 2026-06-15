// Supabase Edge Function — invocada pelo pg_cron 2x por dia
// Chama a rota Next.js /api/agenda/lembretes com o CRON_SECRET

Deno.serve(async () => {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? '';
  const secret = Deno.env.get('CRON_SECRET') ?? '';

  if (!appUrl) {
    console.error('[agenda-lembretes] NEXT_PUBLIC_APP_URL não configurada');
    return new Response(JSON.stringify({ error: 'NEXT_PUBLIC_APP_URL ausente' }), { status: 500 });
  }

  try {
    const res = await fetch(`${appUrl}/api/agenda/lembretes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
    });
    const data = await res.json();
    console.log('[agenda-lembretes] resultado:', JSON.stringify(data));
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (err) {
    console.error('[agenda-lembretes] erro:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 502 });
  }
});
