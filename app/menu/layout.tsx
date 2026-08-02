import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المنيو | وجبات ومكونات مجهزة",
  description:
    "منيو جاهز للدواجن واللحوم والوجبات والمقبلات المجهزة. الطلب قبل الموعد بـ24 ساعة مع توصيل للتجمع والرحاب أو استلام.",
  openGraph: {
    title: "منيو جاهز | JAHEZ",
    description: "مكونات ووجبات مجهزة بعناية لتوفير وقت التحضير.",
    images: ["/assets/jahez/menu-original.jpg"],
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
