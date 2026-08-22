export function RestaurantJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: "جاهز JAHEZ",
    description:
      "منتجات ووجبات مجهزة بعناية وجاهزة للتسوية أو التقديم مع طلب مسبق بـ24 ساعة.",
    image: "/assets/jahez/menu-original.jpg",
    logo: "/assets/jahez/logo.jpg",
    servesCuisine: ["Egyptian", "Ready-to-cook", "Homestyle"],
    priceRange: "EGP",
    areaServed: ["Fifth Settlement", "New Cairo", "East Cairo"],
    hasMenu: "/menu",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "جاهز JAHEZ",
    description: "طعم البيت من غير وقت التحضير.",
    inLanguage: ["ar", "en"],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
