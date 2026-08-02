"use client";

import { useLanguage } from "../language-context";

const sections = {
  ar: [
    {
      title: "البيانات التي نحفظها",
      body: "عند تسجيل طلب نحفظ الاسم ورقم الموبايل والمنطقة والعنوان والبريد الإلكتروني إن كتبته، بالإضافة إلى تفاصيل الطلب وقيمته ووقت إنشائه.",
    },
    {
      title: "لماذا نستخدمها",
      body: "نستخدم البيانات لتنفيذ الطلب والتواصل بخصوصه وتحسين الخدمة وفهم تفضيلات العملاء. لا نستخدم بياناتك في إرسال عروض تسويقية إلا إذا فعّلت الموافقة الاختيارية بنفسك.",
    },
    {
      title: "من يمكنه الاطلاع عليها",
      body: "تظهر بيانات العملاء والطلبات داخل لوحة إدارة Jahez المحمية والمخصصة للمالك. لا نبيع بيانات العملاء.",
    },
    {
      title: "طلب التعديل أو الحذف",
      body: "يمكنك التواصل معنا من خلال وسائل التواصل الموضحة في صفحة «تواصل معنا» لطلب تصحيح بياناتك أو حذفها، وسنتحقق من رقم الموبايل المرتبط بالطلب قبل تنفيذ الطلب.",
    },
  ],
  en: [
    {
      title: "Data we store",
      body: "When you place an order, we store your name, mobile number, area, delivery address, optional email, and the order details, value and creation time.",
    },
    {
      title: "Why we use it",
      body: "We use this data to fulfil and support your order, improve service and understand customer preferences. We only use it for offers when you actively select the optional marketing consent.",
    },
    {
      title: "Who can access it",
      body: "Customer and order data is available only in Jahez's protected owner dashboard. We do not sell customer data.",
    },
    {
      title: "Correction or deletion requests",
      body: "Contact us through the methods shown on the Contact page to request a correction or deletion. We will verify the mobile number linked to the order before acting.",
    },
  ],
} as const;

export default function PrivacyPage() {
  const { isArabic, t } = useLanguage();
  const content = isArabic ? sections.ar : sections.en;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="kicker light">{t("kickerPrivacy")}</span>
          <h1>{isArabic ? "سياسة الخصوصية" : "Privacy policy"}</h1>
          <p>
            {isArabic
              ? "بوضوح ومن غير تعقيد: إيه اللي بنحفظه وليه"
              : "A clear explanation of what we store and why."}
          </p>
        </div>
      </section>
      <section className="content-section privacy-page">
        <div className="container privacy-grid">
          {content.map((section, index) => (
            <article key={section.title}>
              <span>0{index + 1}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
