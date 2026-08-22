"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "../cart-context";
import {
  categories,
  formatPrice,
  productFallbacks,
  type CategoryId,
} from "../data";
import { useCatalog } from "../catalog-context";
import { useLanguage } from "../language-context";
import { PlainImage as Image } from "../plain-image";

export default function MenuPage() {
  const { isArabic, t } = useLanguage();
  const { products, categoryMedia } = useCatalog();
  const { items, addItem, updateQuantity } = useCart();
  const [active, setActive] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as CategoryId;
    if (categories.some((category) => category.id === hash)) {
      queueMicrotask(() => setActive(hash));
    }
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const inCategory = active === "all" || product.category === active;
      const inSearch =
        !normalized ||
        product.name.includes(normalized) ||
        product.nameEn.toLowerCase().includes(normalized) ||
        product.description.includes(normalized) ||
        product.descriptionEn?.toLowerCase().includes(normalized);
      return inCategory && inSearch;
    });
  }, [active, products, query]);

  const grouped = categories
    .map((category) => ({
      ...category,
      products: visible.filter((product) => product.category === category.id),
    }))
    .filter((category) => category.products.length > 0);

  return (
    <>
      <section className="page-hero menu-hero jahez-page-hero">
        <div className="container">
          <div className="hero-content">
            <p className="hero-eyebrow">
              {isArabic ? "منيو چاهِز" : "JAHEZ MENU"}
            </p>
            <h1 className="hero-title">
              {isArabic ? "اختاري اللي يسهّل يومك" : "Choose what makes your day easier"}
            </h1>
            <p className="hero-description">
              {isArabic
                ? "المنتجات بالكيلو تُطلب بكيلو كامل، والمقبلات والوجبات حسب وحدة البيع المكتوبة."
                : "Kilogram products are ordered in full-kilo units; appetizers are sold by pack and meals by the listed unit."}
              {" "}
              {isArabic
                ? "كل الطلبات تحتاج حجزًا قبل الموعد بـ24 ساعة على الأقل."
                : "All orders must be placed at least 24 hours in advance."}
            </p>
          </div>
        </div>
      </section>

      <section className="menu-page content-section">
        <div className="container">
          <div className="menu-toolbar">
            <div className="menu-tabs" role="tablist" aria-label={t("menu")}>
              <button
                className={active === "all" ? "active" : ""}
                onClick={() => setActive("all")}
              >
                {t("all")}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={active === category.id ? "active" : ""}
                  onClick={() => setActive(category.id)}
                >
                  {isArabic ? category.label : category.labelEn}
                </button>
              ))}
            </div>
            <label className="menu-search">
              <span>{t("search")}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isArabic ? "دوري على صنف..." : "Search the menu..."}
              />
            </label>
          </div>

          {grouped.length === 0 ? (
            <div className="empty-state">
              <div>
                <h2>{isArabic ? "مش لاقيين الصنف ده" : "No matches found"}</h2>
                <p>{isArabic ? "جرّبي اسم تاني أو اختاري قسم مختلف" : "Try another search or choose a different category."}</p>
                <button className="button button-dark" onClick={() => setQuery("")}>
                  {isArabic ? "امسحي البحث" : "Clear search"}
                </button>
              </div>
            </div>
          ) : (
            <div className="menu-sections">
              {grouped.map((category) => (
                <section className="menu-category" id={category.id} key={category.id}>
                  <div className="category-showcase">
                    {categoryMedia[category.id]?.videoUrl ? (
                      categoryMedia[category.id].videoUrl!.includes("youtube.com") || categoryMedia[category.id].videoUrl!.includes("youtu.be") ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${categoryMedia[category.id].videoUrl!.includes("youtu.be") ? categoryMedia[category.id].videoUrl!.split("/").pop()?.split("?")[0] : new URL(categoryMedia[category.id].videoUrl!).searchParams.get("v")}`}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={categoryMedia[category.id].videoUrl}
                          className="absolute inset-0 w-full h-full object-cover"
                          autoPlay loop muted playsInline
                        />
                      )
                    ) : (
                      <Image
                        src={categoryMedia[category.id]?.image || category.image}
                        alt={isArabic ? category.label : category.labelEn}
                        fill
                        sizes="(max-width: 760px) 92vw, 32vw"
                      />
                    )}
                    <div className="category-showcase-overlay" />
                    <div>
                      <h2>{isArabic ? category.label : category.labelEn}</h2>
                      <p>{isArabic ? category.note : category.noteEn}</p>
                    </div>
                  </div>
                  <div className="menu-items">
                    {category.products.map((product) => (
                      <article className="menu-item jahez-menu-item" key={product.id}>
                        <div className="menu-item-photo">
                          <Image
                            src={product.image || productFallbacks[product.category]}
                            alt={isArabic ? product.name : product.nameEn}
                            fill
                            sizes="(max-width: 760px) 38vw, 220px"
                            fallbackSrc={productFallbacks[product.category]}
                          />
                        </div>
                        <div className="menu-item-copy">
                          <div className="menu-item-title">
                            <h3>{isArabic ? product.name : product.nameEn}</h3>
                            {product.spicy && <span className="spicy-label">{t("hot")}</span>}
                          </div>
                          <span className="product-en">
                            {isArabic ? product.nameEn : product.name}
                          </span>
                          <p>{isArabic ? product.description : product.descriptionEn}</p>
                          <span className="jahez-unit-pill">
                            {isArabic ? product.unit : product.unitEn}
                          </span>
                        </div>
                        <div className="menu-item-action">
                          <b>{formatPrice(product.price)}</b>
                          {(() => {
                            const entry = items.find((i) => i.id === product.id);
                            const qty = entry?.quantity ?? 0;
                            const details = `${isArabic ? "وحدة البيع" : "Unit"}: ${isArabic ? product.unit : product.unitEn}`;
                            const name = isArabic ? product.name : product.nameEn;
                            if (qty === 0) {
                              return (
                                <button
                                  aria-label={`${t("add")} ${name}`}
                                  onClick={() =>
                                    addItem({
                                      id: product.id,
                                      name,
                                      price: product.price,
                                      details,
                                    })
                                  }
                                >
                                  <span>+</span>
                                  <small>{t("add")}</small>
                                </button>
                              );
                            }
                            return (
                              <div className="menu-qty-stepper" aria-label={name}>
                                <button
                                  type="button"
                                  className="qty-minus"
                                  aria-label={isArabic ? "أنقص واحد" : "Decrease quantity"}
                                  onClick={() =>
                                    entry && updateQuantity(entry.key, entry.quantity - 1)
                                  }
                                >
                                  −
                                </button>
                                <span className="menu-qty-value">{qty}</span>
                                <button
                                  type="button"
                                  className="qty-plus"
                                  aria-label={isArabic ? "زود واحد" : "Increase quantity"}
                                  onClick={() =>
                                    addItem({ id: product.id, name, price: product.price, details })
                                  }
                                >
                                  +
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
