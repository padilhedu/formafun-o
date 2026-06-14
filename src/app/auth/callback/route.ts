import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Troca o `code` do OAuth (Google/PKCE) por uma sessão e redireciona.
// Sem esta rota, o login social volta com ?code=... mas a sessão nunca é
// criada, e o middleware manda o usuário de volta para /login.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  // Só aceita caminho interno (evita open redirect)
  const redirectPath = next.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Falha na troca ou ausência de code → volta ao login com aviso
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
