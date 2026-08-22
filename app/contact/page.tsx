"use client";

import { useCatalog } from "../catalog-context";
import { useLanguage } from "../language-context";

export default function ContactPage() {
  const { settings } = useCatalog();
  const { isArabic, t } = useLanguage();
  const whatsapp = settings.whatsappNumber.trim();
  const socials = [
    { url: settings.socialInstagram?.trim(), label: "Instagram" },
    { url: settings.socialFacebook?.trim(), label: "Facebook" },
    { url: settings.socialTiktok?.trim(), label: "TikTok" },
  ].filter((s) => s.url);

  return (
    <>
      <section className="page-hero jahez-page-hero"><div className="container"><span className="kicker light">{t("kickerContact")}</span><h1>{isArabic ? "عندك سؤال عن الطلب؟" : "Have a question about your order?"}</h1><p>{isArabic ? "رقم التواصل يتم إضافته من لوحة التحكم بمجرد تجهيزه." : "The contact number can be added from the dashboard once ready."}</p></div></section>
      <section className="section"><div className="container contact-grid">
        <article className="contact-card">
          <span>WHATSAPP</span>
          <h2>{isArabic ? "تواصلي مع چاهِز" : "Contact Jahez"}</h2>
          {whatsapp ? <a className="button button-dark" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a> : <p>{isArabic ? "رقم واتساب غير مضاف حاليًا. يمكن إضافته من لوحة التحكم بدون تعديل الكود." : "No WhatsApp number is configured yet. It can be added from the dashboard without changing code."}</p>}
        </article>
        <article className="contact-card">
          <span>SOCIAL</span>
          <h2>{isArabic ? "تابعينا" : "Follow us"}</h2>
          <div className="footer-social contact-social">
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>{s.label}</a>
            ))}
          </div>
        </article>
        <article className="contact-card">
          <span>ORDER POLICY</span>
          <h2>{isArabic ? "قبل ما تطلبي" : "Before ordering"}</h2>
          <p>{isArabic ? "اختاري موعدًا بعد 24 ساعة على الأقل، وحددي موقعك على الخريطة والنظام يحسب التوصيل تلقائيًا." : "Choose a time at least 24 hours ahead, pick your location on the map and delivery is calculated automatically."}</p>
        </article>
      </div></section>
    </>
  );
}
