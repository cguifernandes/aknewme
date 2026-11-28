import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROOMS_ENABLED } from "@/lib/features";
import RoomView from "@/components/account/RoomView";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Sala de duelo", robots: { index: false } };

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  if (!ROOMS_ENABLED) notFound(); // salas desligadas (13-escopo-lancamento.md)
  const { id } = await params;
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <SiteHeader />
      <RoomView id={id} />
    </div>
  );
}
