"use client";

import Link from "next/link";
import { categories, formatPrice, productFallbacks } from "./data";
import { useCatalog } from "./catalog-context";
import { useLanguage } from "./language-context";
import { PlainImage as Image } from "./plain-image";

export default function HomePage() {
  const { products, settings } = useCatalog();
  const { isArabic, t } = useLanguage();
  const featured = products.filter((product) => product.featured).slice(0, 6);
  const whatsapp = settings.whatsappNumber.trim();

  return (
    <>
      <section className="hero jahez-hero">
        <div className="container hero-grid jahez-hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              {isArabic ? "جاهز — JAHEZ" : "JAHEZ — جاهز"}
            </span>
            <h1>
              {isArabic ? (
                <>
                  <span className="gold">طعم البيت</span>
                  <br />
                  من غير وقت التحضير
                </>
              ) : (
                <>
                  <span className="gold">Homestyle Taste</span>
                  <br />
                  Without the Prep Time
                </>
              )}
            </h1>
            <p className="hero-lead">
              {isArabic
                ? "منتجات ووجبات مجهزة بعناية، تساعدك تحضّري أكل البيت بسهولة ومن غير وقت طويل في المطبخ. اطلبي قبلها بـ24 ساعة."
                : "Carefully prepared products and meals to help you serve homestyle food easily, without spending hours in the kitchen. Order 24 hours in advance."}
            </p>
            <div className="hero-actions">
              <Link href="/menu" className="button button-primary">
                {isArabic ? "اختاري من المنيو" : "Explore the menu"}
              </Link>
              <Link href="/about" className="button button-ghost">
                {isArabic ? "اعرفي قصة جاهز" : "Our story"}
              </Link>
            </div>
            <div className="hero-info-row">
              <div className="hero-info-item">
                <span className="hero-info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div className="hero-info-text">
                  <strong>24h</strong>
                  <span>{isArabic ? "طلب مسبق" : "Pre-order"}</span>
                </div>
              </div>
              <div className="hero-info-item">
                <span className="hero-info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 20h12" />
                    <path d="M12 4v16" />
                    <path d="M8 8l4-4 4 4" />
                  </svg>
                </span>
                <div className="hero-info-text">
                  <strong>1kg</strong>
                  <span>{isArabic ? "المنتجات بالكيلو تُطلب بكيلو كامل" : "Kilo products ordered in full"}</span>
                </div>
              </div>
              <div className="hero-info-item">
                <span className="hero-info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div className="hero-info-text">
                  <strong>{isArabic ? "التجمع والرحاب" : "New Cairo & Al Rehab"}</strong>
                  <span>{isArabic ? "مناطق التوصيل الحالية" : "Current delivery areas"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-visual jahez-hero-visual">
            <div className="hero-image-shell jahez-hero-image">
              <Image
                src="/assets/jahez/hero-chicken.jpg"
                alt={isArabic ? "دجاج فاهيتا مجهز من جاهز" : "Prepared chicken fajita from Jahez"}
                fill
                priority
                sizes="(max-width: 900px) 92vw, 48vw"
              />
            </div>
          </div>
        </div>
        <div className="brand-ribbon jahez-ribbon" aria-hidden="true">
          <div className="brand-ribbon-track">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className="jahez-ribbon-set">
                <span>READY IN MINUTES</span><i>●</i>
                <span>KEEP FROZEN</span><i>●</i>
                <span>EASY TO COOK</span><i>●</i>
                <span>MADE FOR FAMILIES</span><i>●</i>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section jahez-benefits-section">
        <div className="container jahez-benefits">
          <article>
            <b>01</b>
            <h3>{isArabic ? "تجهيز يوفر وقتك" : "Prep time saved"}</h3>
            <p>{isArabic ? "اختيار وتجهيز وتتبيل معمولين قبل ما الطلب يوصل لك." : "Selection, preparation and seasoning are handled before your order arrives."}</p>
          </article>
          <article>
            <b>02</b>
            <h3>{isArabic ? "اللمسة الأخيرة في بيتك" : "Your final touch at home"}</h3>
            <p>{isArabic ? "تسوية سهلة بطعم بيتي ومن غير ساعات طويلة في المطبخ." : "Easy cooking with a homestyle result and fewer hours in the kitchen."}</p>
          </article>
          <article>
            <b>03</b>
            <h3>{isArabic ? "توصيل أو استلام" : "Delivery or pickup"}</h3>
            <p>{isArabic ? "التوصيل متاح للتجمع والرحاب، أو اختاري الاستلام." : "Delivery is available in New Cairo and Al Rehab, or choose pickup."}</p>
          </article>
        </div>
      </section>

      <section className="section bestsellers">
        <div className="container">
          <div className="section-heading split">
            <div>
              <span className="kicker">{t("kickerBestsellers")}</span>
              <h2>{isArabic ? "اختيارات تسهّل أسبوعك" : "Choices that make your week easier"}</h2>
            </div>
            <p>
              {isArabic
                ? "كل سعر حسب وحدة البيع الموضحة: كيلو كامل، صينية، أو عبوة."
                : "Each price follows the listed unit: full kilogram, tray or pack."}
            </p>
          </div>
          <div className="featured-grid jahez-featured-grid">
            {featured.map((product, index) => (
              <article className="featured-card" key={product.id}>
                <div className="featured-photo">
                  <Image
                    src={product.image || productFallbacks[product.category]}
                    alt={isArabic ? product.name : product.nameEn}
                    fill
                    sizes="(max-width: 700px) 90vw, 30vw"
                    fallbackSrc={productFallbacks[product.category]}
                  />
                  <span className="card-index">0{index + 1}</span>
                </div>
                <div className="featured-body">
                  <span className="product-en">
                    {isArabic ? product.nameEn : product.name}
                  </span>
                  <h3>{isArabic ? product.name : product.nameEn}</h3>
                  <p>{isArabic ? product.description : product.descriptionEn}</p>
                  <div>
                    <span>
                      <b>{formatPrice(product.price)}</b>
                      <small>{isArabic ? product.unit : product.unitEn}</small>
                    </span>
                    <Link href={`/menu#${product.category}`}>
                      {isArabic ? "أضيفيه" : "Order"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="center-action">
            <Link href="/menu" className="text-link">
              {isArabic ? "شاهدي المنيو كاملًا" : "Explore the full menu"}
            </Link>
          </div>
        </div>
      </section>

      <section className="journey-section jahez-category-section">
        <div className="container">
          <div className="section-heading journey-heading">
            <span className="kicker light">{t("kickerJourney")}</span>
            <h2>
              {isArabic ? "من الفريزر" : "From the freezer"}
              <br />
              <em>{isArabic ? "للسفرة بسهولة" : "to the table, easily"}</em>
            </h2>
          </div>
          <div className="journey-grid jahez-category-grid">
            {categories.map((category) => (
              <Link
                href={`/menu#${category.id}`}
                className="journey-card"
                key={category.id}
              >
                <Image
                  src={category.image}
                  alt={isArabic ? category.label : category.labelEn}
                  fill
                  sizes="(max-width: 700px) 90vw, 33vw"
                />
                <div className="journey-overlay" />
                <div>
                  <span>{isArabic ? category.labelEn : category.label}</span>
                  <h3>{isArabic ? category.label : category.labelEn}</h3>
                  <b>{t("discover")}</b>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section jahez-story-preview">
        <div className="container jahez-story-preview-grid">
          <div>
            <span className="kicker">{t("kickerStory")}</span>
            <h2>{isArabic ? "الوقت قليل… لكن طعم البيت مايتعوضش" : "Time is limited, but homestyle taste still matters"}</h2>
            <p>
              {isArabic
                ? "جاهز اتعمل علشان يساعد ستات البيوت اللي يومهم مليان مسؤوليات، من غير ما يضطروا يختاروا بين الوقت وطعم الأكل البيتي."
                : "Jahez was created for busy home-makers who should not have to choose between saving time and serving homestyle food."}
            </p>
            <Link href="/about" className="button button-dark">
              {isArabic ? "اقرئي القصة" : "Read our story"}
            </Link>
          </div>
          <Image
            src="/assets/jahez/fajita-packaging.jpg"
            alt={isArabic ? "عبوة فاهيتا دجاج جاهز" : "Jahez chicken fajita packaging"}
            width={853}
            height={1280}
          />
        </div>
      </section>

      <section className="order-cta jahez-order-cta">
        <div className="container order-cta-inner">
          <div>
            <span className="kicker light">{t("kickerCta")}</span>
            <h2>{isArabic ? "اختاري دلوقتي واستلمي في الموعد" : "Choose now and receive it on time"}</h2>
            <p>
              {isArabic
                ? "الطلبات تحتاج 24 ساعة تجهيز على الأقل، والدفع كاش حاليًا."
                : "Orders require at least 24 hours of preparation. Cash is currently available."}
            </p>
          </div>
          <div className="order-cta-actions">
            <Link href="/menu" className="button button-cream">
              {isArabic ? "ابدئي الطلب" : "Start your order"}
            </Link>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(isArabic ? "أهلاً جاهز، عايزة أستفسر" : "Hello Jahez, I have a question")}`}
                target="_blank"
                rel="noreferrer"
                className="button button-outline-light"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
