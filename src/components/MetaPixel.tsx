"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/pixel";

/** Pixel do Meta: PageView na 1ª carga e a cada troca de rota. Não desenha nada. */
export default function MetaPixel() {
  const pathname = usePathname();
  useEffect(() => trackPageView(pathname), [pathname]);
  return null;
}
