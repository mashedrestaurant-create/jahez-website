import type { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const isArabic = (await cookies()).get("jahez-language")?.value !== "en";

  if (!isArabic) {
    return {
      title: "Menu | Prepared meals & ingredients",
      description:
        "Jahez menu of prepared poultry, beef, meals and appetizers. Order 24 hours ahead with delivery in New Cairo or pickup.",
      openGraph: {
        title: "Jahez Menu | JAHEZ",
        description:
          "Carefully prepared ingredients and meals that save you prep time.",
        images: ["/assets/jahez/menu-original.jpg"],
      },
    };
  }

  return {
    title: "المنيو | وجبات ومكونات مجهزة",
    description:
      "منيو جاهز للدواجن واللحوم والوجبات والمقبلات المجهزة. الطلب قبل الموعد بـ24 ساعة مع توصيل للتجمع والرحاب أو استلام.",
    openGraph: {
      title: "منيو جاهز | JAHEZ",
      description: "مكونات ووجبات مجهزة بعناية لتوفير وقت التحضير.",
      images: ["/assets/jahez/menu-original.jpg"],
    },
  };
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
