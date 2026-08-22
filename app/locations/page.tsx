"use client";

import { useCatalog } from "../catalog-context";
import { activeDeliveryZones } from "../delivery-zones";
import { useLanguage } from "../language-context";

export default function LocationsPage() {
  const { settings } = useCatalog();
  const { isArabic } = useLanguage();
  const zones = activeDeliveryZones(settings);
  const pickupAddress = isArabic
    ? settings.pickupAddressAr
    : settings.pickupAddressEn;

  return (
    <>
      <section className="jahez-locations-hero">
        <div className="container jahez-locations-hero-inner">
          <span className="kicker light">
            {isArabic ? "توصيل أو استلام" : "DELIVERY OR PICKUP"}
          </span>
          <h1>
            {isArabic
              ? "اختاري الطريقة الأنسب لاستلام طلبك"
              : "Choose the best way to receive your order"}
          </h1>
          <p className="jahez-locations-hero-lead">
            {isArabic
              ? "اطلبي قبل الموعد بـ24 ساعة على الأقل، واختاري التوصيل أو الاستلام أثناء إتمام الطلب."
              : "Order at least 24 hours in advance and choose delivery or pickup at checkout."}
          </p>
        </div>
      </section>

      <section className="jahez-locations-cards-section">
        <div className="container jahez-locations-cards-grid">
          <article className="jahez-location-card">
            <div className="jahez-location-card-header">
              <span className="jahez-location-card-label">
                {isArabic ? "التوصيل" : "DELIVERY"}
              </span>
              <h2>{isArabic ? "مناطق التوصيل الحالية" : "Current delivery areas"}</h2>
              <p className="jahez-location-card-intro">
                {isArabic
                  ? "التوصيل متاح حاليًا داخل التجمع والرحاب."
                  : "Delivery is currently available in New Cairo and Al Rehab."}
              </p>
            </div>
            <div className="jahez-location-card-body">
              <div className="jahez-zone-display">
                {zones.map((zone) => (
                  <div className="jahez-zone-row" key={zone.id}>
                    <div className="jahez-zone-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="jahez-zone-info">
                      <h3>{isArabic ? zone.nameAr : zone.nameEn}</h3>
                      <p>{isArabic ? zone.areasAr : zone.areasEn}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="jahez-zone-fee-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                {isArabic
                  ? "رسوم التوصيل يتم تحديدها من لوحة التحكم حسب المنطقة."
                  : "Delivery fees are configured per zone from the admin dashboard."}
              </p>
            </div>
          </article>

          <article className="jahez-location-card">
            <div className="jahez-location-card-header">
              <span className="jahez-location-card-label">
                {isArabic ? "الاستلام" : "PICKUP"}
              </span>
              <h2>{isArabic ? "استلام طلبك من نقطة چاهِز" : "Pickup from a Jahez point"}</h2>
            </div>
            <div className="jahez-location-card-body">
              <div className="jahez-pickup-detail">
                <div className="jahez-pickup-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <h3>{isArabic ? "نقطة الاستلام" : "Pickup point"}</h3>
                  <p>{pickupAddress}</p>
                </div>
              </div>
              <div className="jahez-pickup-detail">
                <div className="jahez-pickup-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3>{isArabic ? "مواعيد الاستلام" : "Pickup hours"}</h3>
                  <p>
                    {isArabic
                      ? `من ${settings.openTime} إلى ${settings.closeTime}`
                      : `From ${settings.openTime} to ${settings.closeTime}`}
                  </p>
                </div>
              </div>
              {settings.mapsUrl && (
                <a
                  className="jahez-map-button"
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {isArabic ? "افتحي الموقع على الخريطة" : "Open location on map"}
                </a>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="jahez-order-notice-section">
        <div className="container">
          <div className="jahez-order-notice">
            <div className="jahez-order-notice-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3>{isArabic ? "مهم قبل الطلب" : "Important before ordering"}</h3>
              <p>
                {isArabic
                  ? "كل الطلبات تحتاج حجزًا مسبقًا قبل موعد التوصيل أو الاستلام بـ24 ساعة على الأقل."
                  : "All orders require at least 24 hours advance notice before delivery or pickup."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
