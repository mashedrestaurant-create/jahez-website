"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "ar" | "en";

const copy = {
  ar: {
    home: "الرئيسية",
    menu: "المنيو",
    builder: "اختاري وجبتك",
    story: "قصتنا",
    offers: "العروض",
    locations: "التوصيل والاستلام",
    contact: "تواصل معنا",
    cart: "السلة",
    discover: "اكتشفي",
    faq: "الأسئلة الشائعة",
    orderWhatsapp: "تواصلي على واتساب",
    search: "بحث",
    all: "الكل",
    add: "أضيفي للسلة",
    hot: "حار",
    language: "English",
    footerCopy: "منتجات ووجبات مجهزة بعناية لتوفري وقت التحضير وتكملي اللمسة الأخيرة في بيتك.",
    branch: "الاستلام",
    branchName: "نقطة استلام جاهز",
    branchAddress: "العنوان يُضاف من لوحة التحكم",
    hours: "مواعيد الطلب والاستلام",
    admin: "لوحة التحكم",
    privacy: "سياسة الخصوصية",
    kickerBestsellers: "الأكثر طلبًا",
    kickerJourney: "اختاري الأسهل ليومك",
    kickerCta: "طلبيتك محتاجة 24 ساعة",
    kickerFlavorMap: "مناطق التوصيل",
    kickerStory: "قصة جاهز",
    kickerStoryFrom: "من مطبخنا لبيتك",
    kickerLocations: "توصيل أو استلام",
    kickerBranch: "خدمة جاهز",
    kickerContact: "كلمينا",
    kickerFaq: "مهم تعرفي",
    kickerPrivacy: "بياناتك",
    kickerBuild: "اختاري من المنيو",
    kickerInstapay: "دفع فوري",
    kickerDelivery: "بيانات الطلب",
    stickerLine1: "مجهز بعناية",
    stickerLine2: "جاهز للتسوية",
    stickerLine3: "يوفر وقتك",
    ariaLabelNav: "التنقل الرئيسي",
    ariaLabelMenu: "فتح القائمة",
    ariaLabelCart: "سلة الطلب",
    aboutQuote: "رفاهية يومية، مجهّزة",
    aboutValue1: "جودة موثوقة",
    aboutValue2: "تجهيز حسب الطلب",
    aboutValue3: "وقت أقل في المطبخ",
    footerTagline: "رفاهية يومية، مجهّزة",
    account: "طلباتي",
  },
  en: {
    home: "Home",
    menu: "Menu",
    builder: "Choose Your Meal",
    story: "Our Story",
    offers: "Offers",
    locations: "Delivery & Pickup",
    contact: "Contact",
    cart: "Cart",
    discover: "Discover",
    faq: "FAQ",
    orderWhatsapp: "Contact on WhatsApp",
    search: "Search",
    all: "All",
    add: "Add to cart",
    hot: "Spicy",
    language: "العربية",
    footerCopy: "Carefully prepared products and meals that save prep time while you add the final touch at home.",
    branch: "Pickup",
    branchName: "Jahez Pickup Point",
    branchAddress: "Address can be added from the dashboard",
    hours: "Ordering and pickup hours",
    admin: "Dashboard",
    privacy: "Privacy policy",
    kickerBestsellers: "BEST SELLERS",
    kickerJourney: "MAKE YOUR DAY EASIER",
    kickerCta: "ORDER 24 HOURS AHEAD",
    kickerFlavorMap: "DELIVERY AREAS",
    kickerStory: "THE JAHEZ STORY",
    kickerStoryFrom: "FROM OUR KITCHEN TO YOUR HOME",
    kickerLocations: "DELIVERY OR PICKUP",
    kickerBranch: "JAHEZ SERVICE",
    kickerContact: "LET'S TALK",
    kickerFaq: "GOOD TO KNOW",
    kickerPrivacy: "YOUR DATA",
    kickerBuild: "CHOOSE FROM THE MENU",
    kickerInstapay: "INSTAPAY",
    kickerDelivery: "ORDER DETAILS",
    stickerLine1: "CAREFULLY PREPARED",
    stickerLine2: "READY TO COOK",
    stickerLine3: "SAVES YOUR TIME",
    ariaLabelNav: "Main navigation",
    ariaLabelMenu: "Open menu",
    ariaLabelCart: "Shopping cart",
    aboutQuote: "Everyday luxury, prepared",
    aboutValue1: "Trusted Quality",
    aboutValue2: "Prepared to Order",
    aboutValue3: "Less Prep Time",
    footerTagline: "Everyday luxury, prepared",
    account: "My Orders",
  },
} as const;

export type TranslationKey = keyof (typeof copy)["ar"];

type LanguageContextValue = {
  language: Language;
  isArabic: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem("jahez-language");
    if (stored === "ar" || stored === "en") {
      queueMicrotask(() => setLanguage(stored));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("jahez-language", language);
    document.cookie = `jahez-language=${language}; path=/; max-age=31536000; samesite=lax`;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isArabic: language === "ar",
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "ar" ? "en" : "ar")),
      t: (key) => copy[language][key],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
