"use client";

import Link from "next/link";
import { PlainImage as Image } from "../plain-image";
import { useLanguage } from "../language-context";

export default function AboutPage() {
  const { isArabic, t } = useLanguage();

  return (
    <>
      <section className="jahez-story-hero">
        <div className="container jahez-story-hero-grid">
          <div className="jahez-story-hero-copy">
            <span className="kicker light">
              {isArabic ? "قصة جاهز" : "The Jahez Story"}
            </span>
            <h1>
              {isArabic ? (
                <>
                  <span className="gold">الوقت قليل…</span>
                  <br />
                  لكن طعم البيت مايتعوضش
                </>
              ) : (
                <>
                  <span className="gold">Time is short…</span>
                  <br />
                  But homestyle taste is irreplaceable
                </>
              )}
            </h1>
            <p className="jahez-story-hero-lead">
              {isArabic
                ? "اتعمل جاهز علشان يسهّل عليكِ أكتر مرحلة بتاخد وقت ومجهود في الطبخ: التجهيز. إحنا بنختار ونجهز ونتبل، وإنتِ تكمّلي اللمسة الأخيرة في البيت بسهولة."
                : "Jahez was created to ease the most time-consuming stage of cooking: preparation. We select, prepare and season, so you can add the final touch at home with ease."}
            </p>
            <div className="hero-actions">
              <Link href="/menu" className="button button-primary">
                {isArabic ? "اختاري من المنيو" : "Explore the menu"}
              </Link>
              <Link href="/menu" className="button button-ghost">
                {isArabic ? "اكتشفي منتجاتنا" : "Discover our products"}
              </Link>
            </div>
          </div>
          <div className="jahez-story-hero-visual">
            <div className="jahez-story-hero-image">
              <Image
                src="/assets/jahez/fajita-packaging.jpg"
                alt={
                  isArabic
                    ? "عبوة فاهيتا دجاج جاهز"
                    : "Jahez chicken fajita packaging"
                }
                fill
                priority
                sizes="(max-width: 900px) 92vw, 48vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="jahez-story-section">
        <div className="container jahez-story-grid">
          <div className="jahez-story-intro">
            <span className="kicker">
              {isArabic ? "من مطبخنا لبيتك" : "From our kitchen to yours"}
            </span>
            <h2>
              {isArabic
                ? "بدأت الفكرة من سؤال بسيط: ليه تحضير أكل البيت لازم ياخد كل الوقت ده؟"
                : "It started with a simple question: why does preparing homestyle food have to take so much time?"}
            </h2>
          </div>
          <div className="jahez-story-body">
            <p>
              {isArabic
                ? "جاهز اتعمل علشان يساعد كل ست يومها مليان مسؤوليات، لكنها لسه عايزة تقدم لبيتها أكل بطعم البيت وجودة تثق فيها."
                : "Jahez was created to help every homemaker whose day is full of responsibilities, yet who still wants to serve her family food with homestyle taste and quality she trusts."}
            </p>
            <p>
              {isArabic
                ? "إحنا عارفين إن الطبخ مش مجرد تسوية. قبل ما الأكل يوصل للسفرة فيه اختيار مكونات، وتنظيف، وتقطيع، وتتبيل، وتجهيز بياخد ساعات من اليوم."
                : "We know that cooking is not just about heating a pan. Before food reaches the table, there is ingredient selection, cleaning, cutting, seasoning and preparation that can take hours."}
            </p>
            <p>
              {isArabic
                ? "علشان كده بنجهز مجموعة من الدواجن واللحوم والوجبات والمقبلات، متقسمة ومتتبلة ومتغلفة بعناية. تختاري اللي يناسب بيتك، وتطلبي قبلها بـ24 ساعة، وإحنا نجهزه حسب الطلب."
                : "That is why we prepare a range of poultry, beef, meals and appetizers — portioned, seasoned and packaged with care. You choose what suits your home, order 24 hours ahead, and we prepare it fresh."}
            </p>
            <p>
              {isArabic
                ? "إنتِ تكمّلي اللمسة الأخيرة في مطبخك بسهولة، من غير ما تضيّعي يومك كله في التحضير."
                : "You add the final touch in your kitchen with ease, without wasting your whole day on preparation."}
            </p>
            <blockquote className="jahez-story-quote">
              {isArabic
                ? "جاهز مش بديل عن أكل البيت… جاهز هو اللي بيساعدك تعمليه من غير ما يومك كله يضيع في المطبخ."
                : "Jahez does not replace homestyle food. It helps you make it without losing your whole day in the kitchen."}
            </blockquote>
          </div>
        </div>
      </section>

      <section className="jahez-values-section">
        <div className="container">
          <div className="section-heading">
            <span className="kicker">JAHEZ VALUES</span>
            <h2>{isArabic ? "اللي بنبني عليه كل طلب" : "What every order is built on"}</h2>
          </div>
          <div className="jahez-values-grid">
            <article className="jahez-value-card">
              <b>01</b>
              <h3>{isArabic ? "جودة نثق فيها" : "Quality we trust"}</h3>
              <p>
                {isArabic
                  ? "مكونات مختارة، تجهيز واضح، وأسعار مرتبطة بوحدة البيع المكتوبة."
                  : "Clear preparation, ingredients and pricing by the listed selling unit."}
              </p>
            </article>
            <article className="jahez-value-card">
              <b>02</b>
              <h3>{isArabic ? "تجهيز حسب الطلب" : "Prepared to order"}</h3>
              <p>
                {isArabic
                  ? "كل طلب بيتجهز بعناية، علشان يوصلك في أفضل حالة وفي الموعد المحدد."
                  : "A 24-hour lead time allows each order to be prepared carefully."}
              </p>
            </article>
            <article className="jahez-value-card">
              <b>03</b>
              <h3>{isArabic ? "وقت أقل في المطبخ" : "Less time in the kitchen"}</h3>
              <p>
                {isArabic
                  ? "نوفر عليكِ خطوات التحضير الطويلة، ونسيب لكِ اللمسة الأخيرة."
                  : "Less prep time and more flexibility for your home and week."}
              </p>
            </article>
          </div>
          <div className="center-action">
            <Link href="/menu" className="button button-dark">
              {isArabic ? "اختاري طلبك" : "Choose your order"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
