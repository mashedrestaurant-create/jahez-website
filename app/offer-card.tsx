"use client";

import { PlainImage as Image } from "./plain-image";
import { formatPrice } from "./data";
import type { Offer } from "./settings";

export function isOfferExpired(offer: Offer) {
  if (!offer.endDate) return false;
  return new Date(offer.endDate) < new Date();
}

export function isOfferActive(offer: Offer) {
  if (!offer.active) return false;
  if (offer.endDate && new Date(offer.endDate) < new Date()) return false;
  return true;
}

export function formatDateRange(
  start: string,
  end: string,
  isArabic: boolean,
) {
  const locale = isArabic ? "ar-EG" : "en-US";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(locale, { month: "short", day: "numeric" });
  const fmtYear = (d: string) =>
    new Date(d).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(start)} — ${fmtYear(end)}`;
}

export function OfferCard({
  offer,
  isArabic,
}: {
  offer: Offer;
  isArabic: boolean;
}) {
  const expired = isOfferExpired(offer);
  const title = isArabic ? offer.titleAr : offer.titleEn;
  const description = isArabic ? offer.descriptionAr : offer.descriptionEn;
  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}%`
      : formatPrice(offer.discountValue);
  const hasDate = offer.startDate && offer.endDate;
  const actionLabel = isArabic
    ? offer.actionTextAr || offer.actionTextEn || "اطلب الآن"
    : offer.actionTextEn || offer.actionTextAr || "Order Now";

  return (
    <article className="offer-card">
      <div className="offer-card-image">
        {offer.imageUrl ? (
          <Image
            src={offer.imageUrl}
            alt={title}
            fill
            sizes="(max-width: 600px) 100vw, 400px"
          />
        ) : (
          <div className="offer-card-placeholder">
            <span>{isArabic ? "عرض" : "OFFER"}</span>
          </div>
        )}
      </div>
      <div className="offer-card-body">
        {expired ? (
          <span className="offer-card-expired-badge">
            {isArabic ? "انتهى العرض" : "EXPIRED"}
          </span>
        ) : offer.discountValue > 0 ? (
          <div className="offer-card-discount">
            {discountLabel}
            <small>{isArabic ? "خصم" : "OFF"}</small>
          </div>
        ) : null}

        <h2>{title}</h2>

        {description && <p>{description}</p>}

        {hasDate && (
          <small className="offer-dates">
            {formatDateRange(offer.startDate, offer.endDate, isArabic)}
          </small>
        )}

        {!expired && (offer.actionTextAr || offer.actionTextEn) && offer.actionUrl ? (
          <a href={offer.actionUrl} className="offer-card-action">
            {actionLabel}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        ) : expired ? (
          <span className="offer-card-action disabled" aria-disabled="true">
            {isArabic ? "انتهى العرض" : "Offer Ended"}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function FeaturedOffer({
  offer,
  isArabic,
  viewAllLabel,
}: {
  offer: Offer;
  isArabic: boolean;
  viewAllLabel?: string;
}) {
  const title = isArabic ? offer.titleAr : offer.titleEn;
  const description = isArabic ? offer.descriptionAr : offer.descriptionEn;
  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}%`
      : formatPrice(offer.discountValue);
  const actionLabel = isArabic
    ? offer.actionTextAr || offer.actionTextEn || "اطلب الآن"
    : offer.actionTextEn || offer.actionTextAr || "Order Now";

  return (
    <article className="featured-offer">
      <div className="featured-offer-image">
        {offer.imageUrl ? (
          <Image
            src={offer.imageUrl}
            alt={title}
            fill
            sizes="(max-width: 780px) 100vw, 560px"
          />
        ) : (
          <div className="offer-card-placeholder">
            <span>{isArabic ? "عرض" : "OFFER"}</span>
          </div>
        )}
      </div>
      <div className="featured-offer-body">
        {offer.discountValue > 0 && (
          <div className="offer-card-discount">
            {discountLabel}
            <small>{isArabic ? "خصم" : "OFF"}</small>
          </div>
        )}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {(offer.actionTextAr || offer.actionTextEn) && offer.actionUrl ? (
          <div className="featured-offer-actions">
            <a href={offer.actionUrl} className="offer-card-action">
              {actionLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            {viewAllLabel && (
              <a href="/offers" className="featured-offer-secondary">
                {viewAllLabel}
              </a>
            )}
          </div>
        ) : viewAllLabel ? (
          <a href="/offers" className="featured-offer-secondary">
            {viewAllLabel}
          </a>
        ) : null}
      </div>
    </article>
  );
}
