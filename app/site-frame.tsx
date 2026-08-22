"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CartProvider, useCart } from "./cart-context";
import { CatalogProvider, useCatalog } from "./catalog-context";
import { LanguageProvider, useLanguage } from "./language-context";
import { PlainImage as Image } from "./plain-image";

function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { t, toggleLanguage, language } = useLanguage();
  const nav = [
    { href: "/", label: t("home") },
    { href: "/menu", label: t("menu") },
    { href: "/about", label: t("story") },
    { href: "/locations", label: t("locations") },
    { href: "/faq", label: t("faq") },
    { href: "/account", label: t("account") },
  ];

  return (
    <>
      <header className="site-header jahez-header">
        <div className="header-inner">
          <Link
            href="/"
            className="brand-link jahez-brand-link"
            aria-label="Jahez home"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/assets/jahez/logo.jpg"
              alt="چاهِز Jahez"
              width={130}
              height={130}
              priority
              className="brand-wordmark jahez-wordmark"
            />
          </Link>
          <nav className="desktop-nav" aria-label={t("ariaLabelNav")}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="language-toggle"
              onClick={toggleLanguage}
              aria-label={language === "ar" ? "Switch to English" : "التبديل للعربية"}
            >
              {t("language")}
            </button>
            <Link href="/cart" className="cart-button" aria-label={t("ariaLabelCart")}>
              <span>{t("cart")}</span>
              <b>{count}</b>
            </Link>
            <button
              className="menu-toggle"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              aria-label={t("ariaLabelMenu")}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div className={`mobile-nav ${open ? "open" : ""}`}>
        {nav.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href="/contact" onClick={() => setOpen(false)}>
          {t("contact")}
        </Link>
      </div>
    </>
  );
}

function SocialLinksData() {
  const { settings } = useCatalog();
  return [
    { url: settings.socialInstagram?.trim(), label: "Instagram", cls: "instagram", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    )},
    { url: settings.socialFacebook?.trim(), label: "Facebook", cls: "facebook", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    )},
    { url: settings.socialTiktok?.trim(), label: "TikTok", cls: "tiktok", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    )},
  ].filter((l) => l.url);
}

function SocialIcons({ className = "footer-social" }: { className?: string }) {
  const links = SocialLinksData();
  if (links.length === 0) return null;

  return (
    <div className={className}>
      {links.map((l) => (
        <a key={l.label} href={l.url} target="_blank" rel="noreferrer" aria-label={l.label} title={l.label}>
          {l.icon}
        </a>
      ))}
    </div>
  );
}

function FloatingSocial() {
  const links = SocialLinksData();
  if (links.length === 0) return null;

  return (
    <div className="floating-social">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          title={l.label}
          className={`floating-social-item ${l.cls}`}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

function Footer() {
  const { t, isArabic } = useLanguage();
  const { settings } = useCatalog();
  const whatsappNumber = settings.whatsappNumber.trim();
  const pickupAddress = isArabic
    ? settings.pickupAddressAr
    : settings.pickupAddressEn;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer jahez-footer">
      <div className="footer-grid container">
        <div className="footer-brand-col">
          <Image
            src="/assets/jahez/logo.jpg"
            alt="چاهِز Jahez"
            width={120}
            height={120}
            className="footer-logo-jahez"
          />
          <p className="footer-tagline">{t("footerTagline")}</p>
          <SocialIcons />
          <p className="footer-copy">{t("footerCopy")}</p>
        </div>
        <div>
          <h3>{t("discover")}</h3>
          <Link href="/menu">{t("menu")}</Link>
          <Link href="/about">{t("story")}</Link>
          <Link href="/locations">{t("locations")}</Link>
          <Link href="/faq">{t("faq")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
        </div>
        <div>
          <h3>{t("contact")}</h3>
          {whatsappNumber ? (
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}
          <Link href="/contact">{t("contact")}</Link>
        </div>
        <div>
          <h3>{t("branch")}</h3>
          <p>{pickupAddress}</p>
          <Link href="/locations">{t("hours")}</Link>
        </div>
      </div>
      <div className="footer-bottom container">
        <span>{isArabic ? `چاهِز © ${year} — جميع الحقوق محفوظة` : `© ${year} JAHEZ — All rights reserved`}</span>
      </div>
      {whatsappNumber && (
        <a
          className="floating-whatsapp"
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(isArabic ? "أهلاً چاهِز، عايزة أستفسر عن طلب" : "Hello Jahez, I would like to ask about an order")}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t("orderWhatsapp")}
        >
          <span>WhatsApp</span>
          <b>{isArabic ? "كلمينا" : "Contact us"}</b>
        </a>
      )}
      <FloatingSocial />
    </footer>
  );
}

function CartToast() {
  const { notice } = useCart();
  return (
    <div className={`cart-toast ${notice ? "show" : ""}`} aria-live="polite">
      {notice}
    </div>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CatalogProvider>
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </CatalogProvider>
    </LanguageProvider>
  );
}

function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartToast />
    </>
  );
}
