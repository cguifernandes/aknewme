import type { Metadata } from "next";
import AccountPage from "@/components/account/AccountPage";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Sua conta", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <SiteHeader />
      <AccountPage />
    </div>
  );
}
