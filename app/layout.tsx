import type { Metadata } from "next";
import { Alexandria, Cairo } from "next/font/google";
import { headers } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteFrame } from "./site-frame";
import { EventTracker } from "./event-tracker";
import { RestaurantJsonLd, WebsiteJsonLd } from "./json-ld";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-alexandria",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "جاهز | أكل البيت من غير وقت التحضير",
    template: "%s | جاهز JAHEZ",
  },
  description:
    "منتجات ووجبات مجهزة بعناية وجاهزة للتسوية أو التقديم. طلب قبل الموعد بـ24 ساعة مع توصيل للتجمع والرحاب أو استلام.",
  keywords: [
    "جاهز",
    "Jahez",
    "وجبات جاهزة",
    "أكل بيتي",
    "مكونات مجهزة",
    "فراخ متبلة",
    "لحوم متبلة",
    "توصيل التجمع",
    "توصيل الرحاب",
    "ready to cook Egypt",
  ],
  icons: {
    icon: "/assets/jahez/logo.jpg",
    apple: "/assets/jahez/logo.jpg",
  },
  openGraph: {
    title: "جاهز | طعم البيت من غير وقت التحضير",
    description:
      "وجبات ومكونات مجهزة بعناية، تطلبيها قبلها بـ24 ساعة ونوصلها للتجمع والرحاب أو تستلميها.",
    type: "website",
    locale: "ar_EG",
    siteName: "جاهز JAHEZ",
    images: [
      {
        url: "/assets/jahez/menu-original.jpg",
        width: 1200,
        height: 630,
        alt: "منيو جاهز للوجبات والمكونات المجهزة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "جاهز | طعم البيت من غير وقت التحضير",
    description: "Everyday luxury, prepared.",
    images: ["/assets/jahez/menu-original.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const hdrs = await headers();
  const host = (hdrs.get("host") || "").split(":")[0];
  const isAdmin = host.startsWith("admin.");

  return (
    <html lang="ar" dir="rtl" className={`${alexandria.variable} ${cairo.variable}`}>
      <head>
        <meta name="theme-color" content="#0A2D1D" />
        <RestaurantJsonLd />
        <WebsiteJsonLd />
      </head>
      <body>
        {isAdmin ? children : <SiteFrame>{children}</SiteFrame>}
        <EventTracker />
        <SpeedInsights />
      </body>
    </html>
  );
}
