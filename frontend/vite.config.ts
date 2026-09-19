// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Docker/VPS (faza-6) run SSR si proces Node i thjeshtë brenda kontejnerit,
  // jo Cloudflare Workers — prandaj preset-i eksplicit "node-server" këtu.
  // I anashkalohet automatikisht kur ndërtohet brenda sandbox-it të Lovable-it
  // (shih @lovable.dev/vite-tanstack-config: isSandbox e detyron cloudflare-module
  // pavarësisht ç'është këtu), pra s'prish deploy-in e Lovable/Cloudflare.
  nitro: {
    preset: "node-server",
  },
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
  },
});
