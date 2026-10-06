import type { NextConfig } from "next";

// Exportación estática: toda la lógica de juego vive en el cliente y la PWA
// puede precachear el resultado completo de `out/` (ver docs/DECISIONES.md).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
