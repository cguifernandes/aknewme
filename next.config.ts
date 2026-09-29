import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URL antiga do Modo Pistas → nova (301: links e buscadores migram sozinhos)
  async redirects() {
    return [
      { source: "/pistas", destination: "/clues", permanent: true },
      // modo treino foi removido: links antigos caem no desafio do dia
      { source: "/:mode(emoji|opening|clues)/:old(treino|practice)", destination: "/:mode", permanent: false },
    ];
  },
};

export default nextConfig;
