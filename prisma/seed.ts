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

async function main() {
  console.log("Seeding database...");

  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "owner", name: "المالك", email: "owner@example.com", passwordHash: hashSync("Admin@123456", 10), role: "owner", isActive: true } }));
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "admin", name: "مدير النظام", email: "admin@example.com", passwordHash: hashSync("Admin@123456", 10), role: "admin", isActive: true } }));
  await skipDuplicates(() => prisma.adminUser.create({ data: { username: "receiver", name: "مستقبل الطلبات", email: "receiver@example.com", passwordHash: hashSync("Admin@123456", 10), role: "order_receiver", isActive: true } }));
  console.log("Admin users done");

  await skipDuplicates(() => prisma.driver.create({ data: { name: "أحمد محمد", phone: "01012345678", phoneNorm: "01012345678", passwordHash: hashSync("Driver@123", 10), isActive: true, isOnline: false, rating: 4.8 } }));
  await skipDuplicates(() => prisma.driver.create({ data: { name: "محمد علي", phone: "01098765432", phoneNorm: "01098765432", passwordHash: hashSync("Driver@123", 10), isActive: true, isOnline: true, rating: 4.5 } }));
  console.log("Drivers done");

  const catCount = await prisma.category.count();
  let cats;
  if (catCount === 0) {
    cats = await Promise.all([
      prisma.category.create({ data: { nameAr: "المقبلات", nameEn: "Appetizers", slug: "appetizers", descriptionAr: "مقبلات شهية", icon: "🥟", sortOrder: 1, active: true } }),
      prisma.category.create({ data: { nameAr: "الأطباق الرئيسية", nameEn: "Main Dishes", slug: "main-dishes", descriptionAr: "أطباق رئيسية لذيذة", icon: "🍽️", sortOrder: 2, active: true } }),
      prisma.category.create({ data: { nameAr: "المحمصات", nameEn: "Roasted", slug: "roasted", descriptionAr: "محمصات طازجة", icon: "🫕", sortOrder: 3, active: true } }),
      prisma.category.create({ data: { nameAr: "الحلويات", nameEn: "Desserts", slug: "desserts", descriptionAr: "حلويات شرقية", icon: "🍰", sortOrder: 4, active: true } }),
      prisma.category.create({ data: { nameAr: "المشروبات", nameEn: "Beverages", slug: "beverages", descriptionAr: "مشروبات منعشة", icon: "🥤", sortOrder: 5, active: true } }),
      prisma.category.create({ data: { nameAr: "الشوربات", nameEn: "Soups", slug: "soups", descriptionAr: "شوربات ساخنة", icon: "🍲", sortOrder: 6, active: true } }),
    ]);
  } else {
    cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }
  console.log("Categories done:", cats.length);

  const prodCount = await prisma.product.count();
  let products;
  if (prodCount === 0) {
    products = await Promise.all([
      prisma.product.create({ data: { id: "APP-001", slug: "meat-pastries", nameAr: "فطائر لحمة", nameEn: "Meat Pastries", descriptionAr: "فطائر محشوحة باللحم والبصل المبروش", price: 45, compareAtPrice: 55, categoryId: cats[0].id, active: true, available: true, featured: true, bestSeller: true, preparationMinutes: 25, sortOrder: 1 } }),
      prisma.product.create({ data: { id: "APP-002", slug: "spring-roll", nameAr: "سبرينج رول", nameEn: "Spring Roll", descriptionAr: "سبرينج رول مقرمش بالخضار", price: 35, categoryId: cats[0].id, active: true, available: true, bestSeller: true, vegetarian: true, preparationMinutes: 15, sortOrder: 2 } }),
      prisma.product.create({ data: { id: "APP-003", slug: "meat-sambosa", nameAr: "سمبوسة لحمة", nameEn: "Meat Sambosa", descriptionAr: "سمبوسة مقرمشة باللحم والكزبرة", price: 30, categoryId: cats[0].id, active: true, available: true, featured: true, bestSeller: true, spicy: true, preparationMinutes: 20, sortOrder: 3 } }),
      prisma.product.create({ data: { id: "MAIN-001", slug: "meat-kabsa", nameAr: "كبسة لحم", nameEn: "Meat Kabsa", descriptionAr: "كبسة لحم غنم بالوز والزبيب", price: 120, compareAtPrice: 140, categoryId: cats[1].id, active: true, available: true, featured: true, bestSeller: true, spicy: true, preparationMinutes: 35, sortOrder: 1 } }),
      prisma.product.create({ data: { id: "MAIN-002", slug: "mandi-chicken", nameAr: "مندي دجاج", nameEn: "Mandi Chicken", descriptionAr: "مندي دجاج مع البخار والأرز", price: 95, categoryId: cats[1].id, active: true, available: true, featured: true, newProduct: true, preparationMinutes: 30, sortOrder: 2 } }),
      prisma.product.create({ data: { id: "MAIN-003", slug: "maqluba-pasta", nameAr: "مقلوبة باستا", nameEn: "Maqluba Pasta", descriptionAr: "مقلوبة بالباستا والباذنجان", price: 85, categoryId: cats[1].id, active: true, available: true, bestSeller: true, vegetarian: true, preparationMinutes: 25, sortOrder: 3 } }),
      prisma.product.create({ data: { id: "ROST-001", slug: "hummus", nameAr: "حمص بالطحينة", nameEn: "Hummus", descriptionAr: "حمص كريمي بالطحينة والزيتون", price: 25, categoryId: cats[2].id, active: true, available: true, bestSeller: true, vegetarian: true, preparationMinutes: 5, sortOrder: 1 } }),
      prisma.product.create({ data: { id: "ROST-002", slug: "foul-medames", nameAr: "فول مدمس", nameEn: "Foul Medames", descriptionAr: "فول مدمس بالثوم والليمون", price: 20, categoryId: cats[2].id, active: true, available: true, vegetarian: true, preparationMinutes: 5, sortOrder: 2 } }),
      prisma.product.create({ data: { id: "DES-001", slug: "kunafa", nameAr: "كنافة نابلسية", nameEn: "Kunafa", descriptionAr: "كنافة بالجبنة والقشطة", price: 55, compareAtPrice: 65, categoryId: cats[3].id, active: true, available: true, featured: true, bestSeller: true, vegetarian: true, preparationMinutes: 10, sortOrder: 1 } }),
      prisma.product.create({ data: { id: "DES-002", slug: "mixed-baklava", nameAr: "بقلاوة مشكلة", nameEn: "Mixed Baklava", descriptionAr: "تشكيلة من البقلاوة بالفستق والجوز", price: 70, categoryId: cats[3].id, active: true, available: true, featured: true, newProduct: true, vegetarian: true, preparationMinutes: 5, sortOrder: 2 } }),
      prisma.product.create({ data: { id: "BEV-001", slug: "mango-juice", nameAr: "عصير مانجو", nameEn: "Mango Juice", descriptionAr: "عصير مانجو طازج", price: 25, categoryId: cats[4].id, active: true, available: true, bestSeller: true, vegetarian: true, preparationMinutes: 5, sortOrder: 1 } }),
      prisma.product.create({ data: { id: "SOUP-001", slug: "lentil-soup", nameAr: "شوربة عدس", nameEn: "Lentil Soup", descriptionAr: "شوربة عدس بالكمون والليمون", price: 15, categoryId: cats[5].id, active: true, available: true, vegetarian: true, preparationMinutes: 5, sortOrder: 1 } }),
    ]);
  } else {
    products = await prisma.product.findMany();
  }
  console.log("Products done:", products.length);

  await skipDuplicates(() => prisma.location.create({ data: { nameAr: "الفرع الرئيسي", nameEn: "Main Branch", addressAr: "شارع التحرير، المعادي، القاهرة", addressEn: "El Tagamoa, Cairo", phone: "01012345678", whatsapp: "201012345678", latitude: 29.9097, longitude: 31.2592, googleMapsUrl: "https://maps.google.com", active: true, deliveryEnabled: true, pickupEnabled: true } }));
  await skipDuplicates(() => prisma.location.create({ data: { nameAr: "فرع مدينة نصر", nameEn: "Nasr City Branch", addressAr: "شارع مصطفى النحاس، مدينة نصر", addressEn: "Mostafa El Nahas, Nasr City", phone: "01098765432", whatsapp: "201098765432", latitude: 30.0561, longitude: 31.3401, active: true, deliveryEnabled: true, pickupEnabled: false } }));
  console.log("Locations done");

  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "المعادي", nameEn: "Maadi", fee: 25, minimumOrder: 50, etaMinutes: 30, active: true } }));
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "مدينة نصر", nameEn: "Nasr City", fee: 30, minimumOrder: 60, etaMinutes: 35, active: true } }));
  await skipDuplicates(() => prisma.deliveryZone.create({ data: { nameAr: "مصر الجديدة", nameEn: "Heliopolis", fee: 35, minimumOrder: 70, etaMinutes: 40, active: true } }));
  console.log("Delivery zones done");

  await skipDuplicates(() => prisma.paymentMethod.create({ data: { type: "cash", labelAr: "الدفع عند الاستلام", labelEn: "Cash on Delivery", active: true, publicVisible: true, deliveryEnabled: true, pickupEnabled: true, sortOrder: 1 } }));
  await skipDuplicates(() => prisma.paymentMethod.create({ data: { type: "instapay", labelAr: "انستاباي", labelEn: "InstaPay", active: true, publicVisible: true, deliveryEnabled: true, pickupEnabled: true, sortOrder: 2 } }));
  console.log("Payment methods done");

  await skipDuplicates(() => prisma.promoCode.create({ data: { code: "JAHZ20", type: "percentage", value: 20, minOrder: 50, maxDiscount: 40, validFrom: new Date(), validUntil: new Date(Date.now() + 60 * 86400000), usageLimit: 50, isActive: true } }));
  await skipDuplicates(() => prisma.promoCode.create({ data: { code: "FREEDELIVERY", type: "free_delivery", value: 0, minOrder: 100, validFrom: new Date(), validUntil: new Date(Date.now() + 30 * 86400000), usageLimit: 30, isActive: true } }));
  await skipDuplicates(() => prisma.promoCode.create({ data: { code: "WELCOME29", type: "percentage", value: 29, minOrder: 80, maxDiscount: 50, validFrom: new Date(), validUntil: new Date(Date.now() + 30 * 86400000), usageLimit: 100, isActive: true } }));
  await skipDuplicates(() => prisma.promoCode.create({ data: { code: "THURS25", type: "percentage", value: 25, minOrder: 60, maxDiscount: 40, validFrom: new Date(), validUntil: new Date(Date.now() + 90 * 86400000), usageLimit: 200, isActive: true } }));
  console.log("Promo codes done");

  await skipDuplicates(() => prisma.offer.create({ data: { nameAr: "عرض الافتتاح", nameEn: "Grand Opening", originalPrice: 140, offerPrice: 99, discountPercentage: 29, startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000), countdownEnabled: true, active: true, featured: true, promoCode: "WELCOME29", minimumOrder: 80, usageLimit: 100, perCustomerLimit: 2 } }));
  await skipDuplicates(() => prisma.offer.create({ data: { nameAr: "خصم الخميس", nameEn: "Thursday Discount", originalPrice: 100, offerPrice: 75, discountPercentage: 25, startDate: new Date(), endDate: new Date(Date.now() + 90 * 86400000), active: true, promoCode: "THURS25", minimumOrder: 60, usageLimit: 200, perCustomerLimit: 3 } }));
  console.log("Offers done");

  const c1 = await skipDuplicates(() => prisma.customer.create({ data: { name: "سارة أحمد", phone: "01111111111", normalizedPhone: "01111111111", email: "sara@test.com", birthday: new Date("1990-05-15"), totalSpent: 450, ordersCount: 5 } }));
  const c2 = await skipDuplicates(() => prisma.customer.create({ data: { name: "محمد حسن", phone: "01222222222", normalizedPhone: "01222222222", email: "mohamed@test.com", totalSpent: 280, ordersCount: 3 } }));
  console.log("Customers done");

  const loc1 = await prisma.location.findFirst({ where: { nameAr: "الفرع الرئيسي" } });
  const driver1 = await prisma.driver.findFirst({ where: { phoneNorm: "01012345678" } });
  const driver2 = await prisma.driver.findFirst({ where: { phoneNorm: "01098765432" } });

  const orderCount = await prisma.order.count();
  if (orderCount === 0 && c1 && c2 && loc1 && driver1 && driver2) {
    const o1 = await prisma.order.create({ data: { customerName: "سارة أحمد", customerPhone: "01111111111", customerPhoneNorm: "01111111111", customerId: c1.id, branchId: loc1.id, status: "completed", subtotal: 120, deliveryFee: 25, total: 145, paymentMethodType: "cash", address: "المعادي، شارع 9", latitude: 29.91, longitude: 31.26, notes: "بدون بصل", driverId: driver1.id } });
    await prisma.orderItem.create({ data: { orderId: o1.id, productId: "MAIN-001", productNameAr: "كبسة لحم", quantity: 1, unitPrice: 120, totalPrice: 120 } });

    const o2 = await prisma.order.create({ data: { customerName: "محمد حسن", customerPhone: "01222222222", customerPhoneNorm: "01222222222", customerId: c2.id, branchId: loc1.id, status: "out_for_delivery", subtotal: 80, deliveryFee: 30, total: 110, paymentMethodType: "instapay", address: "مدينة نصر", latitude: 30.06, longitude: 31.34, driverId: driver2.id } });
    await prisma.orderItem.create({ data: { orderId: o2.id, productId: "APP-001", productNameAr: "فطائر لحمة", quantity: 2, unitPrice: 45, totalPrice: 90 } });
    await prisma.orderItem.create({ data: { orderId: o2.id, productId: "BEV-001", productNameAr: "عصير مانجو", quantity: 1, unitPrice: 25, totalPrice: 25 } });

    const o3 = await prisma.order.create({ data: { customerName: "سارة أحمد", customerPhone: "01111111111", customerPhoneNorm: "01111111111", customerId: c1.id, branchId: loc1.id, status: "preparing", subtotal: 130, deliveryFee: 25, discount: 13, total: 142, paymentMethodType: "cash", address: "المعادي، شارع 9", latitude: 29.91, longitude: 31.26 } });
    await prisma.orderItem.create({ data: { orderId: o3.id, productId: "DES-001", productNameAr: "كنافة نابلسية", quantity: 2, unitPrice: 55, totalPrice: 110 } });
    await prisma.orderItem.create({ data: { orderId: o3.id, productId: "ROST-001", productNameAr: "حمص بالطحينة", quantity: 1, unitPrice: 25, totalPrice: 25 } });
  }
  console.log("Orders done");

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

  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "سارة أحمد", textAr: "أحلى كنافة ذقتها في حياتي! أكيد هطلب تاني.", rating: 5, source: "Google", active: true } }));
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "محمد حسن", textAr: "الكبسة كانت روعة والتوصيل كان سريع.", rating: 5, source: "Facebook", active: true } }));
  await skipDuplicates(() => prisma.testimonial.create({ data: { nameAr: "نورا إبراهيم", nameEn: "Nora Ibrahim", textEn: "The best frozen food in Cairo. Highly recommended!", rating: 4, source: "Google", active: true } }));
  console.log("Testimonials done");

  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
