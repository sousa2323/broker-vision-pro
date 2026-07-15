import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

// URL canônica do site — og:image precisa ser absoluta para os crawlers das redes sociais.
const siteUrl = "https://ubroker.com.br";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ubroker — Plataforma para corretores de alto padrão" },
      {
        name: "description",
        content:
          "A plataforma que dá aos corretores controle de leads, pipeline, parcerias e monetização. Trabalhe sem trabalhar sozinho.",
      },
      { property: "og:title", content: "Ubroker — Corretores no controle" },
      {
        property: "og:description",
        content:
          "Pipeline, IA, omnichannel, parcerias e monetização SaaS em uma única plataforma para corretores de alto padrão.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl },
      { property: "og:site_name", content: "Ubroker" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: `${siteUrl}/og-image.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Landing page da Ubroker — Corretores no controle",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ubroker — Corretores no controle" },
      {
        name: "twitter:description",
        content:
          "Pipeline, IA, omnichannel, parcerias e monetização SaaS em uma única plataforma para corretores de alto padrão.",
      },
      { name: "twitter:image", content: `${siteUrl}/og-image.jpg` },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-right" richColors />
        <Scripts />
      </body>
    </html>
  );
}
