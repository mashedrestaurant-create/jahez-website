import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التوصيل والاستلام",
  description: "مناطق توصيل جاهز الحالية في التجمع والرحاب، ومعلومات الاستلام ومواعيد الطلب.",
};

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
