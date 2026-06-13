import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import type { Profile } from "@/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data as Profile | null;

    // Auto-criar profile se o trigger não criou (usuário existente antes da migration)
    if (!profile) {
      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const admin = createServiceClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const nome = user.user_metadata?.nome ?? user.email?.split("@")[0] ?? "Usuário";
      const { data: created } = await admin.from("profiles").upsert({ id: user.id, nome, role: "admin" }).select("*").single();
      profile = created as Profile | null;
    }
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
