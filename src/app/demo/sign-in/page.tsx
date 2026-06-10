"use client";

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

export default function SignInDemoPage() {
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
          </span>
        }
        heroImageSrc="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=2160&q=80"
        testimonials={testimonials}
        onSignIn={(e) => { e.preventDefault(); alert("Demo: login submetido"); }}
        onGoogleSignIn={() => alert("Demo: Google")}
        onResetPassword={() => alert("Demo: redefinir senha")}
        onCreateAccount={() => alert("Demo: criar conta")}
      />
    </div>
  );
}
