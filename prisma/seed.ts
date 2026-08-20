import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcryptjs from "bcryptjs";
const { hashSync } = bcryptjs;
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envContent = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function skipDuplicates(fn: () => Promise<any>): Promise<any> {
  return fn().catch((e: any) => {
    if (e.code === "P2002" || e.code === "23505") return null;
    throw e;
  });
}

const REAL_CATEGORIES = [
  { slug: "poultry", nameAr: "دواجن", nameEn: "Poultry", icon: "🐔", sortOrder: 1, descriptionAr: "البيع بالكيلو الكامل — مجهز ومتبل وجاهز للتسوية", descriptionEn: "Sold by the full kilogram — prepared, seasoned and ready to cook" },
  { slug: "beef", nameAr: "لحوم", nameEn: "Beef", icon: "🥩", sortOrder: 2, descriptionAr: "البيع بالكيلو الكامل — تجهيز يومي حسب الطلب", descriptionEn: "Sold by the full kilogram — prepared fresh for each order" },
  { slug: "cooked-meals", nameAr: "وجبات مطهية", nameEn: "Cooked Meals", icon: "🍳", sortOrder: 3, descriptionAr: "جاهزة للتسخين والتقديم", descriptionEn: "Ready to heat and serve" },
  { slug: "ready-meals", nameAr: "وجبات جاهزة", nameEn: "Ready Meals", icon: "📦", sortOrder: 4, descriptionAr: "اختاري الصنف بالحجم ووحدة البيع الموضحة", descriptionEn: "Order using the listed tray or kilogram unit" },
  { slug: "appetizers", nameAr: "مقبلات", nameEn: "Appetizers", icon: "🥟", sortOrder: 5, descriptionAr: "العبوة تحتوي على 15 قطعة", descriptionEn: "Each pack contains 15 pieces" },
];

const REAL_PRODUCTS = [
  { id: "chicken-fajita", categorySlug: "poultry", nameAr: "فاهيتا دجاج", nameEn: "Chicken Fajita", descriptionAr: "شرائح دجاج متبلة بنكهة الفاهيتا وجاهزة للتسوية.", descriptionEn: "Seasoned chicken strips prepared in fajita style and ready to cook.", unit: "كيلو كامل", price: 450, featured: true, spicy: false, image: "/assets/jahez/hero-chicken.jpg" },
  { id: "chicken-curry", categorySlug: "poultry", nameAr: "دجاج بالكاري", nameEn: "Chicken Curry", descriptionAr: "قطع دجاج متبلة بالكاري ومجهزة لوجبة سريعة بطعم غني.", descriptionEn: "Curry-seasoned chicken prepared for a quick, flavorful meal.", unit: "كيلو كامل", price: 450, featured: false, spicy: false, image: "" },
  { id: "oregano-chicken-fillet", categorySlug: "poultry", nameAr: "فيليه دجاج أوريجانو", nameEn: "Oregano Chicken Fillet", descriptionAr: "فيليه دجاج متبل بالأوريجانو والبهارات وجاهز للشوي أو الطهي.", descriptionEn: "Chicken fillet seasoned with oregano and spices, ready to grill or cook.", unit: "كيلو كامل", price: 450, featured: true, spicy: false, image: "" },
  { id: "breaded-chicken", categorySlug: "poultry", nameAr: "تشيكن بانيه", nameEn: "Breaded Chicken", descriptionAr: "شرائح دجاج بانيه متبلة ومجهزة للقلي أو التسوية في الفرن.", descriptionEn: "Seasoned breaded chicken slices ready to fry or oven-cook.", unit: "كيلو كامل", price: 500, featured: false, spicy: false, image: "" },
  { id: "tandoori-chicken", categorySlug: "poultry", nameAr: "دجاج تندوري", nameEn: "Tandoori Chicken", descriptionAr: "دجاج متبل بخليط تندوري متوازن وجاهز للتسوية.", descriptionEn: "Chicken seasoned with a balanced tandoori blend and ready to cook.", unit: "كيلو كامل", price: 450, featured: false, spicy: false, image: "" },
  { id: "crispy-chicken", categorySlug: "poultry", nameAr: "كريسبي دجاج", nameEn: "Crispy Chicken", descriptionAr: "قطع دجاج كريسبي متبلة ومجهزة للقلي.", descriptionEn: "Seasoned crispy chicken pieces prepared for frying.", unit: "كيلو كامل", price: 450, featured: false, spicy: false, image: "" },
  { id: "shish-tawook", categorySlug: "poultry", nameAr: "شيش طاووق", nameEn: "Shish Tawook", descriptionAr: "مكعبات دجاج متبلة بتتبيلة شيش طاووق وجاهزة للشوي.", descriptionEn: "Chicken cubes in a shish tawook marinade, ready to grill.", unit: "كيلو كامل", price: 440, featured: false, spicy: false, image: "" },
  { id: "hot-nashville-chicken", categorySlug: "poultry", nameAr: "هوت ناشفيل تشيكن", nameEn: "Hot Nashville Chicken", descriptionAr: "دجاج متبل بنكهة ناشفيل الحارة ومجهز للقلي.", descriptionEn: "Chicken seasoned with a hot Nashville-style blend and ready to fry.", unit: "كيلو كامل", price: 450, featured: false, spicy: true, image: "" },

  { id: "beef-shawarma", categorySlug: "beef", nameAr: "شاورما لحم", nameEn: "Beef Shawarma", descriptionAr: "شرائح لحم متبلة بتتبيلة الشاورما وجاهزة للتسوية.", descriptionEn: "Beef strips seasoned in shawarma style and ready to cook.", unit: "كيلو كامل", price: 750, featured: true, spicy: false, image: "" },
  { id: "kofta", categorySlug: "beef", nameAr: "كفتة", nameEn: "Kofta", descriptionAr: "كفتة متبلة ومشكلة وجاهزة للشوي أو الطهي.", descriptionEn: "Seasoned shaped kofta ready to grill or cook.", unit: "كيلو كامل", price: 680, featured: false, spicy: false, image: "" },
  { id: "beef-burger", categorySlug: "beef", nameAr: "برجر لحم", nameEn: "Beef Burger", descriptionAr: "برجر لحم متبل ومشكل وجاهز للتسوية.", descriptionEn: "Seasoned beef burger patties prepared and ready to cook.", unit: "كيلو كامل", price: 630, featured: false, spicy: false, image: "" },
  { id: "mini-burger", categorySlug: "beef", nameAr: "ميني برجر", nameEn: "Mini Burger", descriptionAr: "قطع ميني برجر لحم مناسبة للوجبات السريعة والعائلية.", descriptionEn: "Mini beef burger patties suited for quick family meals.", unit: "كيلو كامل", price: 630, featured: false, spicy: false, image: "" },
  { id: "soy-ginger-beef", categorySlug: "beef", nameAr: "لحم صويا وجنزبيل", nameEn: "Soy & Ginger Beef", descriptionAr: "شرائح لحم متبلة بالصويا والجنزبيل وجاهزة للطهي السريع.", descriptionEn: "Beef strips marinated with soy and ginger, ready for quick cooking.", unit: "كيلو كامل", price: 750, featured: false, spicy: false, image: "" },
  { id: "beef-teriyaki", categorySlug: "beef", nameAr: "بيف ترياكي", nameEn: "Beef Teriyaki", descriptionAr: "شرائح لحم بتتبيلة ترياكي متوازنة وجاهزة للتسوية.", descriptionEn: "Beef strips in a balanced teriyaki marinade, ready to cook.", unit: "كيلو كامل", price: 750, featured: false, spicy: false, image: "" },
  { id: "spicy-cajun-beef", categorySlug: "beef", nameAr: "بيف كاجن حار", nameEn: "Spicy Cajun Beef", descriptionAr: "شرائح لحم متبلة بالكاجن الحار وجاهزة للتسوية.", descriptionEn: "Beef strips in a spicy Cajun seasoning, ready to cook.", unit: "كيلو كامل", price: 750, featured: false, spicy: true, image: "" },
  { id: "sweet-chili-beef", categorySlug: "beef", nameAr: "بيف سويت تشيلي", nameEn: "Sweet Chili Beef", descriptionAr: "شرائح لحم بتتبيلة سويت تشيلي وجاهزة للطهي.", descriptionEn: "Beef strips in a sweet chili marinade, ready to cook.", unit: "كيلو كامل", price: 750, featured: false, spicy: false, image: "" },

  { id: "beef-bolognese", categorySlug: "cooked-meals", nameAr: "صوص بولونيز باللحم", nameEn: "Beef Bolognese Sauce", descriptionAr: "صوص بولونيز باللحم مطهي وجاهز للتسخين والتقديم مع المكرونة.", descriptionEn: "Cooked beef bolognese sauce, ready to heat and serve with pasta.", unit: "كيلو كامل", price: 550, featured: true, spicy: false, image: "" },

  { id: "stuffed-vine-leaves", categorySlug: "ready-meals", nameAr: "ورق عنب محشي", nameEn: "Stuffed Vine Leaves", descriptionAr: "ورق عنب محشي ومجهز حسب الطلب.", descriptionEn: "Stuffed vine leaves prepared to order.", unit: "كيلو كامل", price: 260, featured: true, spicy: false, image: "/assets/jahez/ready-meals.jpg" },
  { id: "beef-goulash", categorySlug: "ready-meals", nameAr: "جلاش باللحم", nameEn: "Beef Goulash", descriptionAr: "صينية جلاش محشية باللحم ومجهزة للتسوية.", descriptionEn: "A tray of beef-filled goulash prepared and ready to bake.", unit: "صينية", price: 470, featured: false, spicy: false, image: "" },
  { id: "lasagna", categorySlug: "ready-meals", nameAr: "لازانيا", nameEn: "Lasagna", descriptionAr: "صينية لازانيا مجهزة للتسوية والتقديم.", descriptionEn: "A prepared lasagna tray ready to bake and serve.", unit: "صينية", price: 600, featured: false, spicy: false, image: "" },
  { id: "bechamel-pasta", categorySlug: "ready-meals", nameAr: "مكرونة بشاميل", nameEn: "Bechamel Pasta", descriptionAr: "صينية مكرونة بشاميل مجهزة للتسوية.", descriptionEn: "A prepared bechamel pasta tray ready to bake.", unit: "صينية", price: 600, featured: false, spicy: false, image: "" },

  { id: "vegetable-spring-rolls", categorySlug: "appetizers", nameAr: "سبرينج رول خضار", nameEn: "Vegetable Spring Rolls", descriptionAr: "سبرينج رول بحشوة خضار، مجهز للقلي.", descriptionEn: "Vegetable-filled spring rolls prepared for frying.", unit: "عبوة 15 قطعة", price: 180, featured: false, spicy: false, image: "/assets/jahez/appetizers.jpg" },
  { id: "chicken-spring-rolls", categorySlug: "appetizers", nameAr: "سبرينج رول دجاج", nameEn: "Chicken Spring Rolls", descriptionAr: "سبرينج رول بحشوة دجاج، مجهز للقلي.", descriptionEn: "Chicken-filled spring rolls prepared for frying.", unit: "عبوة 15 قطعة", price: 200, featured: false, spicy: false, image: "" },
  { id: "beef-sambousek", categorySlug: "appetizers", nameAr: "سمبوسك لحم", nameEn: "Beef Sambousek", descriptionAr: "سمبوسك بحشوة لحم، مجهز للقلي أو الخَبز.", descriptionEn: "Beef-filled sambousek prepared for frying or baking.", unit: "عبوة 15 قطعة", price: 200, featured: false, spicy: false, image: "" },
  { id: "cheese-sambousek", categorySlug: "appetizers", nameAr: "سمبوسك جبنة", nameEn: "Cheese Sambousek", descriptionAr: "سمبوسك بحشوة جبنة، مجهز للقلي أو الخَبز.", descriptionEn: "Cheese-filled sambousek prepared for frying or baking.", unit: "عبوة 15 قطعة", price: 150, featured: false, spicy: false, image: "" },
  { id: "chicken-sambousek", categorySlug: "appetizers", nameAr: "سمبوسك دجاج", nameEn: "Chicken Sambousek", descriptionAr: "سمبوسك بحشوة دجاج، مجهز للقلي أو الخَبز.", descriptionEn: "Chicken-filled sambousek prepared for frying or baking.", unit: "عبوة 15 قطعة", price: 200, featured: false, spicy: false, image: "" },
];

async function main() {
  console.log("Seeding database...");

  // ── Admin users ──
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "owner", name: "المالك", email: "owner@example.com", passwordHash: hashSync("Admin@123456", 10), role: "owner", isActive: true } }));
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "admin", name: "مدير النظام", email: "admin@example.com", passwordHash: hashSync("Admin@123456", 10), role: "admin", isActive: true } }));
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "receiver", name: "مستقبل الطلبات", email: "receiver@example.com", passwordHash: hashSync("Admin@123456", 10), role: "order_receiver", isActive: true } }));
  console.log("Admin users done");

  // ── Drivers ──
  await skipDuplicates(() => prisma.driver.create({ data: { name: "أحمد محمد", phone: "01012345678", phoneNorm: "01012345678", passwordHash: hashSync("Driver@123", 10), isActive: true, isOnline: false, rating: 4.8 } }));
  await skipDuplicates(() => prisma.driver.create({ data: { name: "محمد علي", phone: "01098765432", phoneNorm: "01098765432", passwordHash: hashSync("Driver@123", 10), isActive: true, isOnline: true, rating: 4.5 } }));
  console.log("Drivers done");

  // ── Delete old categories & products ──
  const oldProdCount = await prisma.product.count();
  if (oldProdCount > 0) {
    await prisma.orderItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log(`Deleted old products (${oldProdCount}) and categories`);
  }

  // ── Categories from real website ──
  const catMap: Record<string, string> = {};
  for (const cat of REAL_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        descriptionAr: cat.descriptionAr,
        descriptionEn: cat.descriptionEn,
        active: true,
      },
    });
    catMap[cat.slug] = created.id;
  }
  console.log("Categories created:", Object.keys(catMap).length);

  // ── Products from real website ──
  let prodIdx = 0;
  for (const p of REAL_PRODUCTS) {
    prodIdx++;
    const categoryId = catMap[p.categorySlug];
    if (!categoryId) {
      console.warn(`  Skip ${p.id} — category ${p.categorySlug} not found`);
      continue;
    }
    await prisma.product.create({
      data: {
        id: p.id.toUpperCase(),
        slug: p.id,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        categoryId,
        price: p.price,
        active: true,
        available: true,
        featured: p.featured,
        spicy: p.spicy,
        bestSeller: false,
        newProduct: false,
        vegetarian: false,
        imageId: p.image || null,
        shortDescriptionAr: p.unit,
        shortDescriptionEn: p.unit === "كيلو كامل" ? "Full kg" : p.unit === "صينية" ? "Tray" : p.unit,
        sortOrder: prodIdx,
        preparationMinutes: 15,
      },
    });
  }
  console.log("Products created:", REAL_PRODUCTS.length);

  // ── Locations ──
  await skipDuplicates(() => prisma.location.create({ data: { nameAr: "الفرع الرئيسي", nameEn: "Main Branch", addressAr: "شارع التحرير، المعادي، القاهرة", addressEn: "El Tagamoa, Cairo", phone: "01012345678", whatsapp: "201012345678", latitude: 29.9097, longitude: 31.2592, googleMapsUrl: "https://maps.google.com", active: true, deliveryEnabled: true, pickupEnabled: true } }));
  await skipDuplicates(() => prisma.location.create({ data: { nameAr: "فرع مدينة نصر", nameEn: "Nasr City Branch", addressAr: "شارع مصطفى النحاس، مدينة نصر", addressEn: "Mostafa El Nahas, Nasr City", phone: "01098765432", whatsapp: "201098765432", latitude: 30.0561, longitude: 31.3401, active: true, deliveryEnabled: true, pickupEnabled: false } }));
  console.log("Locations done");

  // ── Delivery zones ──
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "المعادي", nameEn: "Maadi", fee: 25, minimumOrder: 50, etaMinutes: 30, active: true } }));
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "مدينة نصر", nameEn: "Nasr City", fee: 30, minimumOrder: 60, etaMinutes: 35, active: true } }));
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "مصر الجديدة", nameEn: "Heliopolis", fee: 35, minimumOrder: 70, etaMinutes: 40, active: true } }));
  console.log("Delivery zones done");

  // ── Payment methods ──
  await skipDuplicates(() => prisma.paymentMethod.create({ data: { type: "cash", labelAr: "الدفع عند الاستلام", labelEn: "Cash on Delivery", active: true, publicVisible: true, deliveryEnabled: true, pickupEnabled: true, sortOrder: 1 } }));
  await skipDuplicates(() => prisma.paymentMethod.create({ data: { type: "instapay", labelAr: "انستاباي", labelEn: "InstaPay", active: true, publicVisible: true, deliveryEnabled: true, pickupEnabled: true, sortOrder: 2 } }));
  console.log("Payment methods done");

  // ── Promo codes ──
  await skipDuplicates(() => prisma.promoCode.create({ data: { code: "JAHZ20", type: "percentage", value: 20, minOrder: 50, maxDiscount: 40, validFrom: new Date(), validUntil: new Date(Date.now() + 60 * 86400000), usageLimit: 50, isActive: true } }));
  await skipDuplicates(() => prisma.promoCode.create({ data: { code: "FREEDELIVERY", type: "free_delivery", value: 0, minOrder: 100, validFrom: new Date(), validUntil: new Date(Date.now() + 30 * 86400000), usageLimit: 30, isActive: true } }));
  console.log("Promo codes done");

  // ── Offers ──
  await skipDuplicates(() => prisma.offer.create({ data: { nameAr: "عرض الافتتاح", nameEn: "Grand Opening", originalPrice: 140, offerPrice: 99, discountPercentage: 29, startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000), countdownEnabled: true, active: true, featured: true, minimumOrder: 80, usageLimit: 100, perCustomerLimit: 2 } }));
  console.log("Offers done");

  // ── Site settings ──
  const settings: Record<string, string> = {
    phone: "01577793871", email: "info@jahez.com", whatsapp: "+201577793871",
    address: "المعادي، القاهرة، مصر", siteNameAr: "جاهز", siteNameEn: "Jahez", logo: "/logo.png",
    heroTitleAr: "أكل بيتي أصيل", heroTitleEn: "Authentic Homemade Food",
    heroSubtitleAr: "تقدملك أشهي المأكولات العربية", heroSubtitleEn: "Serving you the finest Arabic cuisine",
    whatsappNumber: "+201577793871", openingHours: "Sat-Thu: 11AM-11PM, Fri: 2PM-12AM",
  };
  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.siteSetting.findUnique({ where: { key } });
    if (existing) {
      await prisma.siteSetting.update({ where: { key }, data: { value: JSON.stringify(value) } });
    } else {
      await prisma.siteSetting.create({ data: { key, value: JSON.stringify(value) } });
    }
  }
  console.log("Site settings done");

  // ── Site content ──
  const contentItems = [
    { section: "about", key: "story", value: "جاهز بدأت من بيت صغير في القاهرة، وكبرت لتصلي لألف بيت. أكلنا أصيل، وطعمه بيت." },
    { section: "about", key: "mission", value: "نقدم أكل عربي أصيل بجودة عالية وأسعار مناسبة لكل العائلات." },
    { section: "footer", key: "tagline", value: "أكل بيتي أصيل — جاهز ليك" },
    { section: "hero", key: "cta", value: "اطلب دلوقتي" },
  ];
  for (const c of contentItems) {
    const existing = await prisma.siteContent.findUnique({ where: { section_key: { section: c.section, key: c.key } } });
    if (!existing) await prisma.siteContent.create({ data: c });
  }
  console.log("Site content done");

  // ── Testimonials ──
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "سارة أحمد", textAr: "أحلى منتجات أكل بيتي ذقتها في حياتي! أكيد هطلب تاني.", rating: 5, source: "Google", active: true } }));
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "محمد حسن", textAr: "الدجاج المتبل كان روعة والتوصيل كان سريع.", rating: 5, source: "Facebook", active: true } }));
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "نورا إبراهيم", nameEn: "Nora Ibrahim", textEn: "Best frozen food in Cairo. Highly recommended!", rating: 4, source: "Google", active: true } }));
  console.log("Testimonials done");

  // ── Sample customers ──
  await skipDuplicates(() => prisma.customer.create({ data: { name: "سارة أحمد", phone: "01111111111", normalizedPhone: "01111111111", email: "sara@test.com", totalSpent: 450, ordersCount: 5 } }));
  await skipDuplicates(() => prisma.customer.create({ data: { name: "محمد حسن", phone: "01222222222", normalizedPhone: "01222222222", email: "mohamed@test.com", totalSpent: 280, ordersCount: 3 } }));
  console.log("Customers done");

  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
