import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Profile } from "@/types/database";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: Profile | null = null;

  // Só verifica auth se Supabase estiver configurado
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    profile = data as Profile | null;
  }

  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <Topbar profile={profile as Profile | null} />
      <main
        className="min-h-screen pt-14"
        style={{ marginLeft: "224px" }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
