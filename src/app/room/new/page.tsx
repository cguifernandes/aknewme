import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROOMS_ENABLED } from "@/lib/features";
import { Suspense } from "react";
import NewRoom from "@/components/account/NewRoom";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Nova sala de duelo", robots: { index: false } };

export default function NewRoomPage() {
  if (!ROOMS_ENABLED) notFound(); // salas desligadas (13-escopo-lancamento.md)
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <SiteHeader />
      <Suspense>
        <NewRoom />
      </Suspense>
    </div>
  );
}
