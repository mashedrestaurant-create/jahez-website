export type Offer = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  mobileImageUrl?: string;
  offerType: "percentage" | "flat" | "buy_x_get_y" | "free_delivery" | "combo";
  priceBeforeDiscount: number;
  priceAfterDiscount: number;
  discountType: "percentage" | "flat";
  discountValue: number;
  startDate: string;
  endDate: string;
  sortOrder: number;
  active: boolean;
  featured?: boolean;
  actionTextAr?: string;
  actionTextEn?: string;
  actionUrl?: string;
  linkedProductIds?: string[];
};

export type JourneyCity = {
  id: string;
  nameAr: string;
  nameEn: string;
  productAr: string;
  productEn: string;
  descAr: string;
  descEn: string;
  image: string;
  linkTo: string;
  x: number;
  y: number;
  active: boolean;
  sortOrder: number;
};

export type SiteSettings = {
  primaryColor: string;
  accentColor: string;
  creamColor: string;
  whatsappNumber: string;
  mapsUrl: string;
  pickupAddressAr: string;
  pickupAddressEn: string;
  deliveryFee: string;
  deliveryZones: string;
  storeLat: string;
  storeLng: string;
  storeAddressAr: string;
  storeMapsUrl: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  minimumOrder: string;
  freeDeliveryThreshold: string;
  orderLeadHours: string;
  cashOnDeliveryEnabled: string;
  instapayEnabled: string;
  instapayAccount: string;
  instapayPaymentLink: string;
  paymobEnabled: string;
  taglineAr: string;
  taglineEn: string;
  heroTitleAr: string;
  heroTitleEn: string;
  offers: string;
  journeyCities: string;
  openTime: string;
  closeTime: string;
};

export const defaultSettings: SiteSettings = {
  primaryColor: "#0A2D1D",
  accentColor: "#C9A23B",
  creamColor: "#F7F0DF",
  whatsappNumber: "",
  mapsUrl: "https://maps.app.goo.gl/PiqQRLCs3oQ9m7178",
  pickupAddressAr: "نقطة استلام جاهز — التجمع، افتحي الخريطة للوصول للموقع",
  pickupAddressEn: "Jahez pickup point — New Cairo. Open the map for directions",
  deliveryFee: "0",
  deliveryZones: "[]",
  storeLat: "30.005137",
  storeLng: "31.477191",
  storeAddressAr: "التجمع الخامس، القاهرة الجديدة",
  storeMapsUrl: "https://maps.app.goo.gl/PiqQRLCs3oQ9m7178",
  socialInstagram: "https://www.instagram.com/jahezkitchen",
  socialFacebook: "https://www.facebook.com/share/1BfGbhLjw9/",
  socialTiktok: "https://www.tiktok.com/@jahez.kitchen",
  minimumOrder: "0",
  freeDeliveryThreshold: "0",
  orderLeadHours: "24",
  cashOnDeliveryEnabled: "true",
  instapayEnabled: "false",
  instapayAccount: "",
  instapayPaymentLink: "",
  paymobEnabled: "false",
  taglineAr:
    "أكل البيت من غير وقت التحضير — منتجات ووجبات مجهزة بعناية، تطلبيها قبلها بـ24 ساعة.",
  taglineEn:
    "Homestyle meals without the prep time — carefully prepared products ordered 24 hours ahead.",
  heroTitleAr: "طعم البيت… من غير وقت التحضير",
  heroTitleEn: "Homestyle Taste, Without the Prep Time",
  offers: "[]",
  journeyCities: "[]",
  openTime: "09:00",
  closeTime: "21:00",
};
