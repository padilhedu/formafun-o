"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { Typewriter } from "@/components/ui/typewriter";

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Dra. Carolina M.",
    handle: "Ortodontia",
    text: "Orçamento aprovado, contrato assinado e parcelas geradas em minutos. Fluxo completo sem papel.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Patrícia S.",
    handle: "Recepção",
    text: "A agenda e o prontuário no mesmo lugar mudaram nossa rotina. Tudo rápido e organizado.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Dr. Rafael T.",
    handle: "Implantodontia",
    text: "O odontograma digital e o histórico por dente facilitam muito o planejamento clínico.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) setError("Login Google indisponível. Use e-mail e senha.");
  }

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <span className="font-light text-foreground tracking-tighter">
            Forma & Função
          </span>
        }
        description={
          <span>
            Gestão de{" "}
            <Typewriter
              text={["pacientes", "orçamentos", "contratos", "agenda", "financeiro"]}
              speed={70}
              waitTime={1500}
              deleteSpeed={40}
              cursorChar="_"
              className="text-primary font-medium"
            />
            {error && (
              <span className="block mt-2 text-destructive text-sm font-medium">{error}</span>
            )}
            {loading && (
              <span className="block mt-2 text-muted-foreground text-sm">Entrando...</span>
            )}
          </span>
        }
        heroImageSrc="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=2160&q=80"
        testimonials={testimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={() =>
          setError("Para redefinir a senha, contate o administrador da clínica.")
        }
        onCreateAccount={() =>
          setError("Contas são criadas pelo administrador da clínica.")
        }
      />
    </div>
  );
}
