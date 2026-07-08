import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Handshake } from "lucide-react";

export const Route = createFileRoute("/app/parcerias/ativa")({
  component: ActivePartnership,
});

function ActivePartnership() {
  return (
    <div className="space-y-8">
      <Link
        to="/app/parcerias"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para parcerias
      </Link>

      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-24 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
          <Handshake className="h-7 w-7" />
        </div>
        <div className="font-display text-lg">Nenhuma parceria ativa</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Quando você fechar uma parceria com outro corretor, o acompanhamento da operação aparecerá
          aqui.
        </p>
        <Link
          to="/app/parcerias"
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
        >
          <Handshake className="h-4 w-4" /> Explorar corretores
        </Link>
      </div>
    </div>
  );
}
