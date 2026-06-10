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
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
