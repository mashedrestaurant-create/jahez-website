import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التوصيل والاستلام",
  description: "توصيل حسب المسافة من فرع چاهِز في التجمع الخامس، ومعلومات الاستلام ومواعيد الطلب.",
};

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
