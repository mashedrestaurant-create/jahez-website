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
  { id: "chicken-fajita", cat: "poultry", ar: "فاهيتا دجاج", en: "Chicken Fajita", desc: "شرائح دجاج متبلة بنكهة الفاهيتا وجاهزة للتسوية.", unit: "كيلو كامل", price: 450, feat: true, spicy: false, img: "/assets/jahez/hero-chicken.jpg" },
  { id: "chicken-curry", cat: "poultry", ar: "دجاج بالكاري", en: "Chicken Curry", desc: "قطع دجاج متبلة بالكاري ومجهزة لوجبة سريعة بطعم غني.", unit: "كيلو كامل", price: 450, feat: false, spicy: false, img: "" },
  { id: "oregano-chicken-fillet", cat: "poultry", ar: "فيليه دجاج أوريجانو", en: "Oregano Chicken Fillet", desc: "فيليه دجاج متبل بالأوريجانو والبهارات.", unit: "كيلو كامل", price: 450, feat: true, spicy: false, img: "" },
  { id: "breaded-chicken", cat: "poultry", ar: "تشيكن بانيه", en: "Breaded Chicken", desc: "شرائح دجاج بانيه متبلة ومجهزة للقلي.", unit: "كيلو كامل", price: 500, feat: false, spicy: false, img: "" },
  { id: "tandoori-chicken", cat: "poultry", ar: "دجاج تندوري", en: "Tandoori Chicken", desc: "دجاج متبل بخليط تندوري متوازن.", unit: "كيلو كامل", price: 450, feat: false, spicy: false, img: "" },
  { id: "crispy-chicken", cat: "poultry", ar: "كريسبي دجاج", en: "Crispy Chicken", desc: "قطع دجاج كريسبي متبلة ومجهزة للقلي.", unit: "كيلو كامل", price: 450, feat: false, spicy: false, img: "" },
  { id: "shish-tawook", cat: "poultry", ar: "شيش طاووق", en: "Shish Tawook", desc: "مكعبات دجاج متبلة بتتبيلة شيش طاووق.", unit: "كيلو كامل", price: 440, feat: false, spicy: false, img: "" },
  { id: "hot-nashville-chicken", cat: "poultry", ar: "هوت ناشفيل تشيكن", en: "Hot Nashville Chicken", desc: "دجاج متبل بنكهة ناشفيل الحارة.", unit: "كيلو كامل", price: 450, feat: false, spicy: true, img: "" },
  { id: "beef-shawarma", cat: "beef", ar: "شاورما لحم", en: "Beef Shawarma", desc: "شرائح لحم متبلة بتتبيلة الشاورما.", unit: "كيلو كامل", price: 750, feat: true, spicy: false, img: "" },
  { id: "kofta", cat: "beef", ar: "كفتة", en: "Kofta", desc: "كفتة متبلة ومشكلة وجاهزة للشوي.", unit: "كيلو كامل", price: 680, feat: false, spicy: false, img: "" },
  { id: "beef-burger", cat: "beef", ar: "برجر لحم", en: "Beef Burger", desc: "برجر لحم متبل ومشكل.", unit: "كيلو كامل", price: 630, feat: false, spicy: false, img: "" },
  { id: "mini-burger", cat: "beef", ar: "ميني برجر", en: "Mini Burger", desc: "قطع ميني برجر لحم.", unit: "كيلو كامل", price: 630, feat: false, spicy: false, img: "" },
  { id: "soy-ginger-beef", cat: "beef", ar: "لحم صويا وجنزبيل", en: "Soy & Ginger Beef", desc: "شرائح لحم متبلة بالصويا والجنزبيل.", unit: "كيلو كامل", price: 750, feat: false, spicy: false, img: "" },
  { id: "beef-teriyaki", cat: "beef", ar: "بيف ترياكي", en: "Beef Teriyaki", desc: "شرائح لحم بتتبيلة ترياكي.", unit: "كيلو كامل", price: 750, feat: false, spicy: false, img: "" },
  { id: "spicy-cajun-beef", cat: "beef", ar: "بيف كاجن حار", en: "Spicy Cajun Beef", desc: "شرائح لحم متبلة بالكاجن الحار.", unit: "كيلو كامل", price: 750, feat: false, spicy: true, img: "" },
  { id: "sweet-chili-beef", cat: "beef", ar: "بيف سويت تشيلي", en: "Sweet Chili Beef", desc: "شرائح لحم بتتبيلة سويت تشيلي.", unit: "كيلو كامل", price: 750, feat: false, spicy: false, img: "" },
  { id: "beef-bolognese", cat: "cooked-meals", ar: "صوص بولونيز باللحم", en: "Beef Bolognese Sauce", desc: "صوص بولونيز باللحم مطهي وجاهز.", unit: "كيلو كامل", price: 550, feat: true, spicy: false, img: "" },
  { id: "stuffed-vine-leaves", cat: "ready-meals", ar: "ورق عنب محشي", en: "Stuffed Vine Leaves", desc: "ورق عنب محشي ومجهز حسب الطلب.", unit: "كيلو كامل", price: 260, feat: true, spicy: false, img: "/assets/jahez/ready-meals.jpg" },
  { id: "beef-goulash", cat: "ready-meals", ar: "جلاش باللحم", en: "Beef Goulash", desc: "صينية جلاش محشية باللحم.", unit: "صينية", price: 470, feat: false, spicy: false, img: "" },
  { id: "lasagna", cat: "ready-meals", ar: "لازانيا", en: "Lasagna", desc: "صينية لازانيا مجهزة.", unit: "صينية", price: 600, feat: false, spicy: false, img: "" },
  { id: "bechamel-pasta", cat: "ready-meals", ar: "مكرونة بشاميل", en: "Bechamel Pasta", desc: "صينية مكرونة بشاميل مجهزة.", unit: "صينية", price: 600, feat: false, spicy: false, img: "" },
  { id: "vegetable-spring-rolls", cat: "appetizers", ar: "سبرينج رول خضار", en: "Vegetable Spring Rolls", desc: "سبرينج رول بحشوة خضار.", unit: "عبوة 15 قطعة", price: 180, feat: false, spicy: false, img: "/assets/jahez/appetizers.jpg" },
  { id: "chicken-spring-rolls", cat: "appetizers", ar: "سبرينج رول دجاج", en: "Chicken Spring Rolls", desc: "سبرينج رول بحشوة دجاج.", unit: "عبوة 15 قطعة", price: 200, feat: false, spicy: false, img: "" },
  { id: "beef-sambousek", cat: "appetizers", ar: "سمبوسك لحم", en: "Beef Sambousek", desc: "سمبوسك بحشوة لحم.", unit: "عبوة 15 قطعة", price: 200, feat: false, spicy: false, img: "" },
  { id: "cheese-sambousek", cat: "appetizers", ar: "سمبوسك جبنة", en: "Cheese Sambousek", desc: "سمبوسك بحشوة جبنة.", unit: "عبوة 15 قطعة", price: 150, feat: false, spicy: false, img: "" },
  { id: "chicken-sambousek", cat: "appetizers", ar: "سمبوسك دجاج", en: "Chicken Sambousek", desc: "سمبوسك بحشوة دجاج.", unit: "عبوة 15 قطعة", price: 200, feat: false, spicy: false, img: "" },
];

const SITE_SETTINGS: Record<string, string> = {
  phone: "01577793871",
  email: "info@jahez.com",
  whatsapp: "+201577793871",
  whatsappNumber: "+201577793871",
  address: "المعادي، القاهرة، مصر",
  siteNameAr: "جاهز",
  siteNameEn: "Jahez",
  logo: "/logo.png",
  heroTitleAr: "أكل بيتي أصيل",
  heroTitleEn: "Authentic Homemade Food",
  heroSubtitleAr: "تقدمالك أشهي المأكولات العربية",
  heroSubtitleEn: "Serving you the finest Arabic cuisine",
  taglineAr: "أكل البيت من غير وقت التحضير — منتجات ووجبات مجهزة بعناية.",
  taglineEn: "Homestyle meals without the prep time — carefully prepared products ordered 24 hours ahead.",
  openingHours: "Sat-Thu: 11AM-11PM, Fri: 2PM-12AM",
  openTime: "09:00",
  closeTime: "21:00",
  deliveryFee: "0",
  minimumOrder: "0",
  freeDeliveryThreshold: "0",
  orderLeadHours: "24",
  cashOnDeliveryEnabled: "true",
  instapayEnabled: "false",
  instapayAccount: "",
  instapayPaymentLink: "",
  paymobEnabled: "false",
  primaryColor: "#0A2D1D",
  accentColor: "#C9A23B",
  creamColor: "#F7F0DF",
};

async function main() {
  console.log("Seeding database...");

  // ── Admin users ──
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "owner", name: "المالك", email: "owner@example.com", passwordHash: hashSync("Admin@123456", 10), role: "owner", isActive: true } }));
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "admin", name: "مدير النظام", email: "admin@example.com", passwordHash: hashSync("Admin@123456", 10), role: "admin", isActive: true } }));
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "receiver", name: "مستقبل الطلبات", email: "receiver@example.com", passwordHash: hashSync("Admin@123456", 10), role: "order_receiver", isActive: true } }));
  console.log("Admin users done");

  // ── Delete old products & categories ──
  const oldProdCount = await prisma.product.count();
  if (oldProdCount > 0) {
    await prisma.orderItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log(`Deleted old products (${oldProdCount}) and categories`);
  }

  // ── Categories ──
  const catMap: Record<string, string> = {};
  for (const cat of REAL_CATEGORIES) {
    const created = await prisma.category.create({
      data: { nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug, icon: cat.icon, sortOrder: cat.sortOrder, descriptionAr: cat.descriptionAr, descriptionEn: cat.descriptionEn, active: true },
    });
    catMap[cat.slug] = created.id;
  }
  console.log("Categories created:", Object.keys(catMap).length);

  // ── Products ──
  let idx = 0;
  for (const p of REAL_PRODUCTS) {
    idx++;
    await prisma.product.create({
      data: {
        id: p.id.toUpperCase(), slug: p.id, nameAr: p.ar, nameEn: p.en, descriptionAr: p.desc,
        categoryId: catMap[p.cat], price: p.price, active: true, available: true,
        featured: p.feat, spicy: p.spicy, imageId: p.img || null,
        shortDescriptionAr: p.unit,
        shortDescriptionEn: p.unit === "كيلو كامل" ? "Full kg" : p.unit === "صينية" ? "Tray" : p.unit,
        sortOrder: idx, preparationMinutes: 15,
      },
    });
  }
  console.log("Products created:", REAL_PRODUCTS.length);

  // ── Delivery zones ──
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "المعادي", nameEn: "Maadi", fee: 25, minimumOrder: 50, etaMinutes: 30, active: true } }));
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "مدينة نصر", nameEn: "Nasr City", fee: 30, minimumOrder: 60, etaMinutes: 35, active: true } }));
  console.log("Delivery zones done");

  // ── Payment methods ──
  await skipDuplicates(() => prisma.paymentMethod.create({ data: { type: "cash", labelAr: "الدفع عند الاستلام", labelEn: "Cash on Delivery", active: true, publicVisible: true, deliveryEnabled: true, pickupEnabled: true, sortOrder: 1 } }));
  await skipDuplicates(() => prisma.paymentMethod.create({ data: { type: "instapay", labelAr: "انستاباي", labelEn: "InstaPay", active: true, publicVisible: true, deliveryEnabled: true, pickupEnabled: true, sortOrder: 2 } }));
  console.log("Payment methods done");

  // ── Site settings (synced with website) ──
  for (const [key, value] of Object.entries(SITE_SETTINGS)) {
    const existing = await prisma.siteSetting.findUnique({ where: { key } });
    if (existing) {
      await prisma.siteSetting.update({ where: { key }, data: { value: JSON.stringify(value) } });
    } else {
      await prisma.siteSetting.create({ data: { key, value: JSON.stringify(value) } });
    }
  }
  console.log("Site settings done (synced with website)");

  // ── Site content ──
  const contentItems = [
    { section: "about", key: "story", value: "جاهز بدأت من بيت صغير في القاهرة، وكبرت لألف بيت. أكلنا أصيل، وطعمه بيت." },
    { section: "about", key: "mission", value: "نقدم أكل عربي أصيل بجودة عالية وأسعار مناسبة." },
    { section: "footer", key: "tagline", value: "أكل بيتي أصيل — جاهز ليك" },
  ];
  for (const c of contentItems) {
    const existing = await prisma.siteContent.findUnique({ where: { section_key: { section: c.section, key: c.key } } });
    if (!existing) await prisma.siteContent.create({ data: c });
  }
  console.log("Site content done");

  // ── Testimonials ──
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "سارة أحمد", textAr: "أحلى منتجات أكل بيتي ذقتها! أكيد هطلب تاني.", rating: 5, source: "Google", active: true } }));
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "محمد حسن", textAr: "الدجاج المتبل كان روعة والتوصيل سريع.", rating: 5, source: "Facebook", active: true } }));
  console.log("Testimonials done");

  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
