import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URL antiga do Modo Pistas → nova (301: links e buscadores migram sozinhos)
  async redirects() {
    return [
      { source: "/pistas", destination: "/clues", permanent: true },
      // rota de treino passou de /treino para /practice
      { source: "/:mode(emoji|opening|clues)/treino", destination: "/:mode/practice", permanent: true },
    ];
  },
};

export default nextConfig;
