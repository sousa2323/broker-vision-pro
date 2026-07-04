import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Instagram,
  Loader2,
  Mail,
  MailCheck,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  signUpBroker,
  step1Schema,
  step2Schema,
  step3Schema,
  type SignupPayload,
  type Step1Values,
  type Step2Values,
  type Step3Values,
} from "@/lib/auth";
import {
  CANAIS,
  DISPONIBILIDADES,
  ESPECIALIDADES,
  TICKETS,
  TIPOS_IMOVEL,
} from "@/data/broker-options";
import { AuthShell } from "@/components/auth-shell";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChipGroup } from "@/components/chip-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cadastro")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [{ title: "Criar conta — Ubroker" }],
  }),
  component: CadastroPage,
});

const STEPS = [
  { n: 1, label: "Acesso" },
  { n: 2, label: "Perfil profissional" },
  { n: 3, label: "Configuração" },
] as const;

function CadastroPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<Partial<SignupPayload>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailPendente, setEmailPendente] = useState<string | null>(null);

  async function finish(step3: Step3Values) {
    const payload = { ...data, ...step3 } as SignupPayload;
    setSubmitting(true);
    const result = await signUpBroker(payload, avatarFile);
    setSubmitting(false);

    if (result.status === "error") {
      toast.error(result.message);
      return;
    }
    if (result.status === "confirm-email") {
      setEmailPendente(payload.email);
      return;
    }
    toast.success("Conta criada! Bem-vindo à Ubroker.");
    navigate({ to: "/app" });
  }

  return (
    <AuthShell
      headline={
        <>
          Sua operação,
          <br />
          no seu controle.
        </>
      }
      subline="Crie sua conta de corretor e configure seu perfil profissional — leads, pipeline, IA e parcerias em um único lugar."
    >
      {emailPendente ? (
        <CheckEmailState email={emailPendente} />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8">
          <StepIndicator current={step} />

          {step === 1 && (
            <Step1Acesso
              defaults={data}
              onNext={(v) => {
                setData((d) => ({ ...d, ...v }));
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <Step2Profissional
              defaults={data}
              avatarFile={avatarFile}
              onAvatarChange={setAvatarFile}
              onBack={(v) => {
                setData((d) => ({ ...d, ...v }));
                setStep(1);
              }}
              onNext={(v) => {
                setData((d) => ({ ...d, ...v }));
                setStep(3);
              }}
            />
          )}
          {step === 3 && (
            <Step3Comercial
              defaults={data}
              submitting={submitting}
              onBack={(v) => {
                setData((d) => ({ ...d, ...v }));
                setStep(2);
              }}
              onSubmit={finish}
            />
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}

// ---------------------------------------------------------------------------
// Indicador de etapas
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((s) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li key={s.n} className="flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                done || active ? "bg-warm" : "bg-border",
              )}
            />
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold",
                  done
                    ? "bg-warm text-warm-foreground"
                    : active
                      ? "bg-navy text-navy-foreground"
                      : "bg-surface text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : s.n}
              </span>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Etapa 1 — Dados de acesso
// ---------------------------------------------------------------------------

function Step1Acesso({
  defaults,
  onNext,
}: {
  defaults: Partial<SignupPayload>;
  onNext: (v: Step1Values) => void;
}) {
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: defaults.fullName ?? "",
      email: defaults.email ?? "",
      phone: defaults.phone ?? "",
      password: defaults.password ?? "",
      confirmPassword: defaults.confirmPassword ?? "",
      acceptTerms: defaults.acceptTerms ?? false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <header>
          <h2 className="font-display text-2xl tracking-tight">Dados de acesso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie sua conta com os dados que você usará para entrar.
          </p>
        </header>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone / WhatsApp</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(21) 99999-9999" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="mt-0.5"
                  />
                </FormControl>
                <FormLabel className="text-xs font-normal leading-relaxed text-muted-foreground">
                  Li e aceito os{" "}
                  <a href="#" className="font-medium text-brand hover:underline">
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a href="#" className="font-medium text-brand hover:underline">
                    Política de Privacidade
                  </a>
                  , incluindo o tratamento dos meus dados conforme a LGPD.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full rounded-full bg-warm text-warm-foreground hover:bg-warm hover:brightness-110"
        >
          Continuar <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Etapa 2 — Perfil profissional
// ---------------------------------------------------------------------------

function Step2Profissional({
  defaults,
  avatarFile,
  onAvatarChange,
  onBack,
  onNext,
}: {
  defaults: Partial<SignupPayload>;
  avatarFile: File | null;
  onAvatarChange: (file: File | null) => void;
  onBack: (v: Partial<Step2Values>) => void;
  onNext: (v: Step2Values) => void;
}) {
  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      creci: defaults.creci ?? "",
      avatarUrl: defaults.avatarUrl ?? "",
      bio: defaults.bio ?? "",
      regions: defaults.regions ?? [],
      propertyTypes: defaults.propertyTypes ?? [],
      specialties: defaults.specialties ?? [],
      ticketRange: defaults.ticketRange ?? "",
    },
  });

  const regions = form.watch("regions");
  const propertyTypes = form.watch("propertyTypes");
  const specialties = form.watch("specialties");
  const [regionInput, setRegionInput] = useState("");

  function addRegion() {
    const value = regionInput.trim();
    if (!value) return;
    if (!regions.includes(value)) {
      form.setValue("regions", [...regions, value], { shouldValidate: true });
    }
    setRegionInput("");
  }

  const toggleIn =
    (name: "propertyTypes" | "specialties", current: string[]) => (label: string) => {
      form.setValue(
        name,
        current.includes(label) ? current.filter((s) => s !== label) : [...current, label],
        { shouldValidate: true },
      );
    };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <header>
          <h2 className="font-display text-2xl tracking-tight">Perfil profissional</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Essas informações alimentam o matching, a distribuição de leads e a busca de parceiros.
          </p>
        </header>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            Foto / avatar <span className="text-muted-foreground">— opcional</span>
          </div>
          <AvatarUpload file={avatarFile} onFileChange={onAvatarChange} />
        </div>

        <FormField
          control={form.control}
          name="creci"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CRECI</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: RJ-45123" className="sm:w-72" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Bio / apresentação <span className="text-muted-foreground">— opcional</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Descreva seu posicionamento, experiência e diferenciais no mercado."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Regiões de atuação */}
        <FormField
          control={form.control}
          name="regions"
          render={() => (
            <FormItem>
              <FormLabel>Regiões de atuação</FormLabel>
              <div className="flex flex-wrap gap-2">
                {regions.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs text-navy-foreground"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "regions",
                          regions.filter((x) => x !== r),
                          { shouldValidate: true },
                        )
                      }
                      className="text-navy-foreground/70 hover:text-navy-foreground"
                      aria-label={`Remover ${r}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={regionInput}
                  onChange={(e) => setRegionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRegion();
                    }
                  }}
                  placeholder="Ex.: Niterói, Icaraí, Região Oceânica…"
                />
                <Button type="button" variant="outline" onClick={addRegion} className="shrink-0">
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="propertyTypes"
          render={() => (
            <FormItem>
              <ChipGroup
                label="Tipos de imóvel"
                options={TIPOS_IMOVEL}
                selected={propertyTypes}
                onToggle={toggleIn("propertyTypes", propertyTypes)}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialties"
          render={() => (
            <FormItem>
              <ChipGroup
                label="Especialidades"
                options={ESPECIALIDADES}
                selected={specialties}
                onToggle={toggleIn("specialties", specialties)}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ticketRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faixa de ticket</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Valor dos imóveis que trabalha" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TICKETS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onBack(form.getValues())}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-full bg-warm text-warm-foreground hover:bg-warm hover:brightness-110"
          >
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Etapa 3 — Configuração comercial e canais
// ---------------------------------------------------------------------------

const CANAL_ICONS = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  email: Mail,
} as const;

function Step3Comercial({
  defaults,
  submitting,
  onBack,
  onSubmit,
}: {
  defaults: Partial<SignupPayload>;
  submitting: boolean;
  onBack: (v: Partial<Step3Values>) => void;
  onSubmit: (v: Step3Values) => void;
}) {
  const form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      channels: defaults.channels ?? { whatsapp: true, instagram: false, email: false },
      availability: defaults.availability ?? "",
      leadLimit: defaults.leadLimit ?? 30,
      plan: defaults.plan ?? "Free",
    },
  });

  const channels = form.watch("channels");
  const plan = form.watch("plan");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <header>
          <h2 className="font-display text-2xl tracking-tight">Configuração comercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina seus canais e preferências. Tudo pode ser ajustado depois nas Configurações.
          </p>
        </header>

        {/* Canais */}
        <div>
          <div className="mb-2 text-sm font-medium">
            Canais de atendimento{" "}
            <span className="font-normal text-muted-foreground">
              — a conexão é feita depois, no Inbox
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {CANAIS.map((c) => {
              const Icon = CANAL_ICONS[c.id];
              const active = channels[c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => form.setValue("channels", { ...channels, [c.id]: !active })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-navy bg-navy text-navy-foreground"
                      : "border-border bg-surface/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4" />
                    {active && <Check className="h-3.5 w-3.5 text-warm" />}
                  </div>
                  <div className={cn("mt-2 text-sm font-medium", active && "text-navy-foreground")}>
                    {c.label}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-[11px] leading-snug",
                      active ? "text-navy-foreground/70" : "",
                    )}
                  >
                    {c.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disponibilidade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Como você atende" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DISPONIBILIDADES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leadLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de leads / mês</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Plano */}
        <div>
          <div className="mb-2 text-sm font-medium">Plano</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <PlanCard
              title="Free"
              price="R$ 0"
              description="Comece agora: CRM, pipeline e perfil profissional."
              selected={plan === "Free"}
              onSelect={() => form.setValue("plan", "Free")}
            />
            <PlanCard
              title="Pro"
              price="R$ 149/mês"
              description="IA, omnichannel completo e prioridade na distribuição."
              selected={plan === "Pro"}
              onSelect={() => form.setValue("plan", "Pro")}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Você pode fazer upgrade a qualquer momento — a cobrança do Pro só começa após o teste.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onBack(form.getValues())}
            className="rounded-full"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-full bg-warm text-warm-foreground hover:bg-warm hover:brightness-110"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Criar conta <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PlanCard({
  title,
  price,
  description,
  selected,
  onSelect,
}: {
  title: string;
  price: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-navy bg-navy text-navy-foreground"
          : "border-border bg-surface/60 hover:border-foreground/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <span
          className={cn(
            "grid h-4 w-4 place-items-center rounded-full border",
            selected ? "border-warm bg-warm text-warm-foreground" : "border-border",
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      </div>
      <div className="num mt-1 text-lg font-semibold">{price}</div>
      <div
        className={cn(
          "mt-1 text-xs leading-snug",
          selected ? "text-navy-foreground/70" : "text-muted-foreground",
        )}
      >
        {description}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Estado pós-cadastro com confirmação de e-mail pendente
// ---------------------------------------------------------------------------

function CheckEmailState({ email }: { email: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface">
        <MailCheck className="h-7 w-7 text-warm" />
      </div>
      <h2 className="mt-4 font-display text-2xl tracking-tight">Confirme seu e-mail</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Enviamos um link de confirmação para{" "}
        <span className="font-medium text-foreground">{email}</span>. Clique no link para ativar sua
        conta e depois faça login.
      </p>
      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-warm px-6 py-2.5 text-sm font-medium text-warm-foreground transition hover:brightness-110"
      >
        Ir para o login <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
