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
              alt="جاهز Jahez"
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
            alt="جاهز Jahez"
            width={120}
            height={120}
            className="footer-logo-jahez"
          />
          <p className="footer-tagline">{t("footerTagline")}</p>
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
        <span>{isArabic ? `جاهز © ${year} — جميع الحقوق محفوظة` : `© ${year} JAHEZ — All rights reserved`}</span>
      </div>
      {whatsappNumber && (
        <a
          className="floating-whatsapp"
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(isArabic ? "أهلاً جاهز، عايزة أستفسر عن طلب" : "Hello Jahez, I would like to ask about an order")}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t("orderWhatsapp")}
        >
          <span>WhatsApp</span>
          <b>{isArabic ? "كلمينا" : "Contact us"}</b>
        </a>
      )}
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
