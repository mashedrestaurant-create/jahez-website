import type { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const isArabic = (await cookies()).get("jahez-language")?.value !== "en";

  if (!isArabic) {
    return {
      title: "Delivery & Pickup",
      description:
        "Distance-based delivery from our Jahez branch in New Cairo, with pickup information and ordering hours.",
    };
  }

  return {
    title: "التوصيل والاستلام",
    description:
      "توصيل حسب المسافة من فرع چاهِز في التجمع الخامس، ومعلومات الاستلام ومواعيد الطلب.",
  };
}

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
