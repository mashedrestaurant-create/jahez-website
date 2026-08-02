"use client";

import { useState } from "react";
import { useLanguage } from "../language-context";

const faqData = [
  {
    id: "advance-order",
    questionAr: "أطلب قبل الموعد بقد إيه؟",
    answerAr: "كل الطلبات لازم تتعمل قبل موعد التوصيل أو الاستلام بـ24 ساعة على الأقل، لأن المنتجات بتتجهز بعناية حسب الطلب.",
    questionEn: "How far in advance should I order?",
    answerEn: "All orders must be placed at least 24 hours before delivery or pickup, because products are prepared fresh to order.",
  },
  {
    id: "half-kilo",
    questionAr: "المنتجات اللي بالكيلو ينفع أطلب نص كيلو؟",
    answerAr: "لا، الأصناف المكتوب عليها سعر بالكيلو بتتطلب بكيلو كامل ومضاعفاته فقط.",
    questionEn: "Can I order half a kilogram for kilo products?",
    answerEn: "No, products priced per kilogram can only be ordered in full-kilogram units and multiples.",
  },
  {
    id: "delivery-areas",
    questionAr: "بتوصلوا لمناطق إيه؟",
    answerAr: "التوصيل متاح حاليًا داخل التجمع والرحاب. المناطق ورسوم التوصيل بتظهر أثناء إتمام الطلب، وبتتحدد من لوحة التحكم.",
    questionEn: "Which areas do you deliver to?",
    answerEn: "Delivery is currently available in New Cairo and Al Rehab. Areas and delivery fees appear at checkout and are managed from the admin dashboard.",
  },
  {
    id: "minimum-order",
    questionAr: "هل يوجد حد أدنى للطلب؟",
    answerAr: "لا، مفيش حد أدنى لإجمالي الطلب. لكن الأصناف اللي بتتباع بالكيلو لازم تتطلب بكيلو كامل.",
    questionEn: "Is there a minimum order?",
    answerEn: "No, there is no minimum order total. However, kilogram products must be ordered in full-kilogram quantities.",
  },
  {
    id: "payment",
    questionAr: "إيه طرق الدفع المتاحة؟",
    answerAr: "الدفع كاش هو المتاح حاليًا. طرق الدفع الأخرى مثل InstaPay والدفع بالبطاقة هتظهر تلقائيًا لما يتم تفعيلها من إدارة الموقع.",
    questionEn: "What payment methods are available?",
    answerEn: "Cash on delivery is currently available. Other payment methods like InstaPay and card payment will appear automatically once enabled from the admin dashboard.",
  },
  {
    id: "pickup",
    questionAr: "ينفع أستلم الطلب بدل التوصيل؟",
    answerAr: "أيوه، تقدري تختاري الاستلام من نقطة جاهز أثناء إتمام الطلب، وهيظهر لكِ رابط الموقع ومواعيد الاستلام.",
    questionEn: "Can I choose pickup instead of delivery?",
    answerEn: "Yes, you can choose pickup from a Jahez point at checkout. The map link and pickup hours will be displayed.",
  },
  {
    id: "ready-to-cook",
    questionAr: "المنتجات جاهزة للأكل ولا محتاجة تسوية؟",
    answerAr: "ده بيختلف حسب الصنف. بعض المنتجات جاهزة للتسوية، وبعض الوجبات جاهزة أو مطهية. تفاصيل كل منتج وطريقة التعامل معاه بتكون مكتوبة داخل صفحة الصنف.",
    questionEn: "Are the products ready to eat or do they need cooking?",
    answerEn: "It depends on the product. Some items are ready to cook, while others are pre-cooked or ready to serve. Details and preparation instructions are listed on each product page.",
  },
  {
    id: "prices",
    questionAr: "هل الأسعار ثابتة؟",
    answerAr: "الأسعار الظاهرة على الموقع هي الأسعار المعتمدة وقت الطلب، وكل صنف بيظهر مع وحدة البيع الخاصة به سواء بالكيلو أو الصينية أو العبوة.",
    questionEn: "Are the prices fixed?",
    answerEn: "The prices shown on the website are the approved prices at the time of ordering. Each product displays its selling unit, whether by kilogram, tray, or pack.",
  },
  {
    id: "cancel-order",
    questionAr: "هل أقدر أعدل أو ألغي الطلب؟",
    answerAr: "التعديل أو الإلغاء بيكون حسب حالة الطلب ووقت بدء التجهيز. تواصلي معانا على واتساب لو الرقم متاح ومفعل من لوحة التحكم.",
    questionEn: "Can I modify or cancel my order?",
    answerEn: "Modification or cancellation depends on the order status and when preparation has begun. Contact us via WhatsApp if the number is available and enabled from the admin dashboard.",
  },
  {
    id: "order-confirmation",
    questionAr: "إزاي أعرف إن طلبي اتسجل؟",
    answerAr: "بعد إتمام الطلب هتظهر رسالة تأكيد ورقم الطلب، وتقدري تراجعي طلباتك من صفحة «طلباتي» لو الخاصية متاحة للحساب.",
    questionEn: "How do I know my order was placed?",
    answerEn: "After placing your order, a confirmation message and order number will appear. You can also review your orders from the My Orders page if the feature is available for your account.",
  },
];

export default function FaqPage() {
  const { isArabic } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <>
      <section className="jahez-faq-hero">
        <div className="container jahez-faq-hero-inner">
          <span className="kicker light">
            {isArabic ? "سؤال في بالك؟" : "GOT A QUESTION?"}
          </span>
          <h1>
            {isArabic
              ? "كل اللي محتاجة تعرفيه قبل الطلب"
              : "Everything you need to know before ordering"}
          </h1>
          <p className="jahez-faq-hero-lead">
            {isArabic
              ? "إجابات واضحة عن الطلب، التوصيل، الاستلام، وحدات البيع وطرق الدفع."
              : "Clear answers about ordering, delivery, pickup, selling units and payment methods."}
          </p>
        </div>
      </section>

      <section className="jahez-faq-section">
        <div className="container jahez-faq-container">
          <div className="jahez-faq-intro">
            <span className="kicker">
              {isArabic ? "الأسئلة الشائعة" : "FREQUENTLY ASKED"}
            </span>
            <h2>{isArabic ? "قبل ما تطلبي" : "Before you order"}</h2>
            <p>
              {isArabic
                ? "جمعنا لكِ أهم التفاصيل عن طريقة الطلب والتوصيل والاستلام علشان تجربتك تكون واضحة من البداية."
                : "We have gathered the key details about ordering, delivery and pickup so your experience is clear from the start."}
            </p>
          </div>

          <div className="jahez-faq-list">
            {faqData.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  className={`jahez-faq-item ${isOpen ? "open" : ""}`}
                  key={item.id}
                >
                  <button
                    type="button"
                    className="jahez-faq-trigger"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span className="jahez-faq-question">
                      {isArabic ? item.questionAr : item.questionEn}
                    </span>
                    <span className="jahez-faq-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="jahez-faq-answer"
                      id={`faq-answer-${item.id}`}
                      role="region"
                    >
                      <p>{isArabic ? item.answerAr : item.answerEn}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
