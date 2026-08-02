import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "العروض",
  description: "عروض جاهز المتاحة حاليًا على المنتجات والوجبات المجهزة.",
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
