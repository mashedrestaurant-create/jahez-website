"use client";

import { useEffect, useState } from "react";
import { useCatalog } from "../catalog-context";
import { useLanguage } from "../language-context";
import { OfferCard, isOfferActive, isOfferExpired } from "../offer-card";
import type { Offer } from "../settings";

function parseOffers(raw: string): Offer[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function OfferSkeleton() {
  return (
    <div className="offer-card-skeleton" role="status" aria-hidden="true">
      <div className="skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton-badge" />
        <div className="skeleton-line" />
        <div className="skeleton-line-short" />
        <div className="skeleton-line-xshort" />
        <div className="skeleton-button" />
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { settings } = useCatalog();
  const { isArabic } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const allOffers = parseOffers(settings.offers);
  const activeOffers = allOffers
    .filter((o) => isOfferActive(o))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const expiredOffers = allOffers
    .filter((o) => o.active && isOfferExpired(o))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const displayOffers = [...activeOffers, ...expiredOffers];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="kicker light">
            {isArabic ? "العروض" : "OFFERS"}
          </span>
          <h1>{isArabic ? "عروض وخصومات" : "Deals & Offers"}</h1>
          <p>
            {isArabic
              ? "تابع عروضنا وخصوماتنا الحالية — اطلب دلوقتي قبل ما تخلص"
              : "Check our current deals and discounts — order now before they end."}
          </p>
        </div>
      </section>
      <section className="offers-page content-section">
        <div className="container">
          {loading ? (
            <div className="offers-grid">
              <OfferSkeleton />
              <OfferSkeleton />
              <OfferSkeleton />
            </div>
          ) : displayOffers.length === 0 ? (
            <div className="offers-empty">
              <div className="offers-empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <h2>{isArabic ? "مفيش عروض دلوقتي" : "No active offers right now"}</h2>
              <p>
                {isArabic
                  ? "تابعنا علشان تعرف أول ما ينزل عرض جديد"
                  : "Stay tuned — new offers drop regularly."}
              </p>
            </div>
          ) : (
            <div className="offers-grid">
              {displayOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} isArabic={isArabic} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
