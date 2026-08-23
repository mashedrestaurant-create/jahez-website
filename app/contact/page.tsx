"use client";

import { useCatalog } from "../catalog-context";
import { useLanguage } from "../language-context";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}

export default function ContactPage() {
  const { settings } = useCatalog();
  const { isArabic } = useLanguage();
  const whatsapp = settings.whatsappNumber.trim();
  const mapsUrl = settings.storeMapsUrl?.trim() || "https://maps.app.goo.gl/PiqQRLCs3oQ9m7178";
  const socials = [
    { url: settings.socialInstagram?.trim(), label: "Instagram", icon: <InstagramIcon />, color: "#E1306C" },
    { url: settings.socialFacebook?.trim(), label: "Facebook", icon: <FacebookIcon />, color: "#1877F2" },
    { url: settings.socialTiktok?.trim(), label: "TikTok", icon: <TikTokIcon />, color: "#000000" },
  ].filter((s) => s.url);

  return (
    <div className="contact-page">
      {/* Hero */}
      <section className="page-hero jahez-page-hero">
        <div className="container">
          <span className="kicker light">{isArabic ? "تواصل معنا" : "GET IN TOUCH"}</span>
          <h1>{isArabic ? "عايزة تواصلي معانا؟" : "Let's Talk"}</h1>
          <p>{isArabic ? "فريقنا جاهز لمساعدتك في أي وقت" : "Our team is ready to help you anytime"}</p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="section" style={{ background: "#f7f0df" }}>
        <div className="container">
          <div className="contact-cards-grid">
            {/* WhatsApp */}
            <div className="contact-info-card">
              <div className="contact-info-icon" style={{ background: "#25D366", color: "#fff" }}>
                <WhatsAppIcon />
              </div>
              <h3>{isArabic ? "واتساب" : "WhatsApp"}</h3>
              <p className="contact-info-desc">{isArabic ? "تواصلي معانا مباشرة عبر واتساب" : "Chat with us directly on WhatsApp"}</p>
              {whatsapp ? (
                <a className="contact-info-btn" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(isArabic ? "أهلاً چاهِز، عايزة أستفسر" : "Hello Jahez, I have a question")}`} target="_blank" rel="noreferrer">
                  {isArabic ? "ابدأ المحادثة" : "Start Chat"}
                </a>
              ) : (
                <p className="contact-info-unavailable">{isArabic ? "غير مضاف حاليًا" : "Not available yet"}</p>
              )}
            </div>

            {/* Phone */}
            <div className="contact-info-card">
              <div className="contact-info-icon" style={{ background: "#0a2d1d", color: "#c9a23b" }}>
                <PhoneIcon />
              </div>
              <h3>{isArabic ? "الهاتف" : "Phone"}</h3>
              <p className="contact-info-desc">{isArabic ? "اتصلي بنا مباشرة" : "Call us directly"}</p>
              {whatsapp ? (
                <a className="contact-info-btn" href={`tel:${whatsapp}`}>
                  {whatsapp}
                </a>
              ) : (
                <p className="contact-info-unavailable">{isArabic ? "غير مضاف حاليًا" : "Not available yet"}</p>
              )}
            </div>

            {/* Location */}
            <div className="contact-info-card">
              <div className="contact-info-icon" style={{ background: "#c9a23b", color: "#0a2d1d" }}>
                <MapPinIcon />
              </div>
              <h3>{isArabic ? "الموقع" : "Location"}</h3>
              <p className="contact-info-desc">{isArabic ? settings.storeAddressAr || "ال Fifth Settlement، القاهرة الجديدة" : "Fifth Settlement, New Cairo"}</p>
              <a className="contact-info-btn" href={mapsUrl} target="_blank" rel="noreferrer">
                {isArabic ? "افتحي الخريطة" : "Open Map"}
              </a>
            </div>

            {/* Hours */}
            <div className="contact-info-card">
              <div className="contact-info-icon" style={{ background: "#0a2d1d", color: "#fff" }}>
                <ClockIcon />
              </div>
              <h3>{isArabic ? "ساعات العمل" : "Working Hours"}</h3>
              <p className="contact-info-desc">{isArabic ? "يوميًا من 12 ظهرًا حتى 12 منتصف الليل" : "Daily from 12 PM to 12 AM"}</p>
              <a className="contact-info-btn" href="/locations">
                {isArabic ? "تفاصيل الفرع" : "Branch Details"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media */}
      {socials.length > 0 && (
        <section className="section" style={{ background: "#0a2d1d" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <span style={{ color: "#c9a23b", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {isArabic ? "تابعونا" : "FOLLOW US"}
            </span>
            <h2 style={{ color: "#fff", fontSize: "2rem", fontWeight: 700, marginTop: "0.5rem" }}>
              {isArabic ? "وسائل التواصل الاجتماعي" : "Social Media"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
              {isArabic ? "ابقي معانا على السوشيال ميديا للتحديثات والعروض" : "Stay connected for updates and offers"}
            </p>
            <div className="contact-social-row" style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginTop: "2rem", flexWrap: "wrap" }}>
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label} className="contact-social-link">
                  <span className="contact-social-icon" style={{ background: s.color }}>{s.icon}</span>
                  <span className="contact-social-label">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Order Policy */}
      <section className="section" style={{ background: "#f7f0df" }}>
        <div className="container" style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ color: "#0a2d1d", fontSize: "1.5rem", fontWeight: 700 }}>
            {isArabic ? "سياسة الطلب" : "Order Policy"}
          </h2>
          <p style={{ color: "#555", marginTop: "1rem", lineHeight: 1.8 }}>
            {isArabic
              ? "لو عايزة تطلبي، اختاري موعدًا بعد 24 ساعة على الأقل، وحددي موقعك على الخريطة وهنحسبلك رسوم التوصيل تلقائيًا. أي استفسار تاني، كلمينا على واتساب!"
              : "To place an order, choose a time at least 24 hours ahead, pick your location on the map and delivery fees will be calculated automatically. For any other questions, reach us on WhatsApp!"}
          </p>
        </div>
      </section>
    </div>
  );
}
