import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/context/AuthContext";
import { RealtimeProvider } from "@/context/RealtimeContext";
import { ToastProvider } from "@/context/ToastContext";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { Footer } from "@/components/layout/Footer";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { ChatWidget } from "@/components/chat/ChatWidget";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
        404
      </div>
      <div>
        <h1 className="text-xl font-semibold text-textPrimary">Faqja nuk u gjet</h1>
        <p className="mt-1 text-textSecondary">
          Faqja që kërkove nuk ekziston ose është zhvendosur.
        </p>
      </div>
      <Link
        to="/"
        className="mt-2 rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-primary-hover"
      >
        Kthehu në ballinë
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold text-textPrimary">Diçka shkoi keq</h1>
      <p className="text-sm text-textSecondary">Provo përsëri ose kthehu në ballinë.</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover"
        >
          Provo përsëri
        </button>
        <a
          href="/"
          className="rounded border border-border bg-surface px-4 py-2 text-sm text-textPrimary hover:bg-background"
        >
          Ballina
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Thrifted — Modë e dorës së dytë me shpirt" },
      {
        name: "description",
        content:
          "Blej dhe shit rroba të përdorura online. Zbulo copa unike, bëj oferta dhe jepi rrobave një jetë të re.",
      },
      { property: "og:title", content: "Thrifted — Modë e dorës së dytë me shpirt" },
      {
        property: "og:description",
        content: "Tregu shqip për rroba second-hand: shfleto, ofero, shit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Lora:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <div className="flex min-h-screen flex-col bg-background">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-surface focus:outline-none"
              >
                Kalo te përmbajtja kryesore
              </a>
              <Navbar />
              <CategoryNav />
              <EmailVerificationBanner />
              <main id="main-content" className="flex flex-1 flex-col">
                <Outlet />
              </main>
              <Footer />
              <ScrollToTop />
              <ChatWidget />
            </div>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
