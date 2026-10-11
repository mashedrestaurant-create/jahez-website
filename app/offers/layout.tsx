import type { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const isArabic = (await cookies()).get("jahez-language")?.value !== "en";

  if (!isArabic) {
    return {
      title: "Offers",
      description: "Current Jahez offers on prepared products and meals.",
    };
  }

  return {
    title: "العروض",
    description: "عروض جاهز المتاحة حاليًا على المنتجات والوجبات المجهزة.",
  };
}

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
