"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categories, formatPrice, type Product } from "../data";
import {
  defaultSettings,
  type Offer,
  type JourneyCity,
  type SiteSettings,
} from "../settings";
import { PlainImage as Image } from "../plain-image";
import {
  parseDeliveryZones,
  serializeDeliveryZones,
  type DeliveryZone,
} from "../delivery-zones";
import AnalyticsPanel from "./analytics-panel";
import CustomerSegments from "./customer-segments";

type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  birthday?: string;
  area: string;
  marketingConsent: boolean;
  ordersCount: number;
  totalSpent: number;
  lastSeenAt: string;
};

type Order = {
  id: number;
  customerId: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: string;
  deliveryZone: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  address: string;
  notes: string;
  createdAt: string;
  items: Array<{ name?: string; quantity?: number }>;
};

type AdminProduct = Product & { active: boolean; custom?: boolean };
type AdminRole = "owner" | "admin" | "order_receiver";
type StaffMember = {
  id?: number;
  email: string;
  name: string;
  role: "admin" | "order_receiver";
  active: boolean;
};
type PaymobStatus = {
  apiKey: boolean;
  hmacSecret: boolean;
  integrationId: boolean;
  iframeId: boolean;
  publicKey: boolean;
  configured: boolean;
};
type Tab =
  | "overview"
  | "catalog"
  | "payments"
  | "identity"
  | "customers"
  | "orders"
  | "offers"
  | "users"
  | "cities"
  | "analytics";

const orderStatuses = [
  { value: "new", label: "طلب جديد" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "preparing", label: "جاري التحضير" },
  { value: "ready", label: "جاهز" },
  { value: "out_for_delivery", label: "خرج للتوصيل" },
  { value: "completed", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
] as const;

type SoundId = "doorbell" | "alarm" | "digital" | "classic" | "cashier" | "urgent";

const SOUND_LIBRARY: Record<SoundId, { label: string; play: () => void }> = {
  doorbell: {
    label: "جرس باب",
    play: () => {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      [
        { freq: 830, start: 0, dur: 0.35 },
        { freq: 660, start: 0.3, dur: 0.45 },
        { freq: 830, start: 0.85, dur: 0.35 },
        { freq: 660, start: 1.15, dur: 0.45 },
      ].forEach((n) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = n.freq;
        g.gain.setValueAtTime(0.001, now + n.start);
        g.gain.exponentialRampToValueAtTime(1.0, now + n.start + 0.015);
        g.gain.setValueAtTime(1.0, now + n.start + n.dur * 0.4);
        g.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now + n.start); osc.stop(now + n.start + n.dur);
      });
      window.setTimeout(() => void ctx.close(), 2200);
    },
  },
  alarm: {
    label: "منبّه حاد",
    play: () => {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = i * 0.15;
        osc.type = "square";
        osc.frequency.value = i % 2 === 0 ? 900 : 1100;
        g.gain.setValueAtTime(0.001, now + t);
        g.gain.exponentialRampToValueAtTime(0.9, now + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.13);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now + t); osc.stop(now + t + 0.14);
      }
      window.setTimeout(() => void ctx.close(), 1500);
    },
  },
  digital: {
    label: "رقمي حديث",
    play: () => {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = i * 0.12;
        osc.type = "triangle";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.001, now + t);
        g.gain.exponentialRampToValueAtTime(0.9, now + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.25);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now + t); osc.stop(now + t + 0.26);
      });
      window.setTimeout(() => void ctx.close(), 1000);
    },
  },
  classic: {
    label: "كلاسيك رنين",
    play: () => {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      for (let rep = 0; rep < 3; rep++) {
        const base = rep * 0.5;
        [1200, 1500].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const t = base + i * 0.18;
          osc.type = "sine";
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.001, now + t);
          g.gain.exponentialRampToValueAtTime(0.85, now + t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.16);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + t); osc.stop(now + t + 0.17);
        });
      }
      window.setTimeout(() => void ctx.close(), 2000);
    },
  },
  cashier: {
    label: "صندوق كاشير",
    play: () => {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      // cha-ching: metallic rising sweep
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
      osc.frequency.setValueAtTime(1200, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.7, now + 0.01);
      g.gain.setValueAtTime(0.7, now + 0.15);
      g.gain.setValueAtTime(0.5, now + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.55);
      window.setTimeout(() => void ctx.close(), 800);
    },
  },
  urgent: {
    label: "عاجل متكرر",
    play: () => {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = i * 0.25;
        osc.type = "sine";
        osc.frequency.value = 1000;
        g.gain.setValueAtTime(0.001, now + t);
        g.gain.exponentialRampToValueAtTime(1.0, now + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now + t); osc.stop(now + t + 0.13);
      }
      window.setTimeout(() => void ctx.close(), 1500);
    },
  },
};

const SOUND_STORAGE_KEY = "jahez-sound-id";

function getSavedSoundId(): SoundId {
  try {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved && saved in SOUND_LIBRARY) return saved as SoundId;
  } catch {}
  return "doorbell";
}

let currentSoundId: SoundId = typeof window !== "undefined" ? getSavedSoundId() : "doorbell";

function playOrderAlert() {
  try {
    SOUND_LIBRARY[currentSoundId].play();
  } catch {}
}

function isWithinBusinessHours(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const cairoHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Cairo",
    }).format(now),
  );
  const cairoMinute = parseInt(
    new Intl.DateTimeFormat("en-US", {
      minute: "numeric",
      timeZone: "Africa/Cairo",
    }).format(now),
  );
  const currentMinutes = cairoHour * 60 + cairoMinute;
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }
  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
}

let alertInterval: ReturnType<typeof setInterval> | null = null;
let alertContext: AudioContext | null = null;

function startRepeatingAlert() {
  stopRepeatingAlert();
  playOrderAlert();
  alertInterval = setInterval(() => {
    playOrderAlert();
  }, 4000);
}

function stopRepeatingAlert() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
  if (alertContext) {
    alertContext.close().catch(() => {});
    alertContext = null;
  }
}

const zoneNumberFields: Array<{
  key: "fee" | "minimumOrder" | "freeDeliveryThreshold" | "etaMinutes";
  label: string;
}> = [
  { key: "fee", label: "رسوم التوصيل" },
  { key: "minimumOrder", label: "الحد الأدنى" },
  {
    key: "freeDeliveryThreshold",
    label: "مجاني بداية من (0 = لا)",
  },
  { key: "etaMinutes", label: "الوقت المتوقع بالدقيقة" },
];

export function AdminDashboard({
  userName,
  role,
}: {
  userName: string;
  role: AdminRole;
}) {
  const canManage = role === "owner" || role === "admin";
  const canManageUsers = role === "owner";
  const [tab, setTab] = useState<Tab>(
    role === "order_receiver" ? "orders" : "overview",
  );
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [paymobConfigured, setPaymobConfigured] = useState(false);
  const [paymobStatus, setPaymobStatus] = useState<PaymobStatus | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [journeyCities, setJourneyCities] = useState<JourneyCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundId, setSoundId] = useState<SoundId>(() => getSavedSoundId());
  const highestOrderId = useRef(0);
  const soundEnabledRef = useRef(true);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin")
      .then((response) => {
        if (!response.ok) throw new Error("load");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setProducts(payload.products || []);
        setSettings({ ...defaultSettings, ...(payload.settings || {}) });
        try {
          const raw = payload.settings?.offers;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : [];
          setOffers(Array.isArray(parsed) ? parsed : []);
        } catch {
          setOffers([]);
        }
        try {
          const rawCities = payload.settings?.journeyCities;
          const parsedCities = typeof rawCities === "string" ? JSON.parse(rawCities) : [];
          setJourneyCities(Array.isArray(parsedCities) ? parsedCities : []);
        } catch {
          setJourneyCities([]);
        }
        setCustomers(payload.customers || []);
        const initialOrders = (payload.orders || []) as Order[];
        setOrders(initialOrders);
        highestOrderId.current = Math.max(
          0,
          ...initialOrders.map((order) => Number(order.id) || 0),
        );
        setStaff(payload.staff || []);
        setPaymobConfigured(Boolean(payload.paymobConfigured));
        setPaymobStatus(payload.paymobStatus || null);
      })
      .catch(() => {
        if (active) setNotice("تعذر تحميل بيانات لوحة التحكم");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (loading) return;
    let active = true;

    const refreshOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (!active) return;
        const nextOrders = (payload.orders || []) as Order[];
        const nextHighest = Math.max(
          0,
          ...nextOrders.map((order) => Number(order.id) || 0),
        );
        const pendingCount = nextOrders.filter(
          (order) => (order.orderStatus || "new") === "new",
        ).length;

        if (nextHighest > highestOrderId.current) {
          const newest = nextOrders.find((order) => order.id === nextHighest);
          if (soundEnabledRef.current) {
            startRepeatingAlert();
          }
          setNotice(`وصل طلب جديد #${newest?.id || nextHighest}`);
          window.setTimeout(() => setNotice(""), 5000);
        } else if (pendingCount === 0 && alertInterval) {
          stopRepeatingAlert();
        }

        highestOrderId.current = Math.max(highestOrderId.current, nextHighest);
        setOrders(nextOrders);
        setCustomers(payload.customers || []);
      } catch {
        // Keep the current screen stable and retry on the next cycle.
      }
    };

    const timer = window.setInterval(refreshOrders, 5000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshOrders();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loading]);

  const newOrdersCount = orders.filter(
    (order) => (order.orderStatus || "new") === "new",
  ).length;

  useEffect(() => {
    document.title = newOrdersCount
      ? `(${newOrdersCount}) طلب جديد · جاهز`
      : "Jahez Control Room";
    return () => {
      document.title = "جاهز";
    };
  }, [newOrdersCount]);

  const totalRevenue = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.total || order.subtotal || 0),
        0,
      ),
    [orders],
  );
  const marketingCustomers = customers.filter(
    (customer) => customer.marketingConsent,
  ).length;

  const save = async () => {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
        settings: { ...settings, offers: JSON.stringify(offers), journeyCities: JSON.stringify(journeyCities) },
        products,
        staff,
      }),
      });
      if (!response.ok) throw new Error("save");
      setNotice("تم حفظ التعديلات وتطبيقها على الموقع");
      window.setTimeout(() => setNotice(""), 2600);
    } catch {
      setNotice("تعذر حفظ التعديلات، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const addStaffMember = () => {
    setStaff((current) => [
      {
        email: "",
        name: "",
        role: "order_receiver",
        active: true,
      },
      ...current,
    ]);
    setNotice("اكتب اسم الموظف وبريده وحدد الصلاحية ثم اضغط حفظ التعديلات");
  };

  const updateStaffMember = (
    index: number,
    patch: Partial<StaffMember>,
  ) => {
    setStaff((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...patch } : member,
      ),
    );
  };

  const updateProduct = (
    id: string,
    patch: Partial<AdminProduct>,
  ) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, ...patch } : product,
      ),
    );
  };

  const addProduct = () => {
    const id = `custom-${Date.now()}`;
    setProducts((current) => [
      {
        id,
        category: "poultry",
        name: "صنف جديد",
        nameEn: "New item",
        description: "اكتب وصف الصنف بالعربي",
        descriptionEn: "Add the English item description",
        unit: "كيلو كامل",
        unitEn: "Full kg",
        image: "/assets/jahez/logo.jpg",
        price: 0,
        active: true,
        featured: false,
        custom: true,
      },
      ...current,
    ]);
    setNotice("تمت إضافة صنف جديد، كمّل بياناته ثم اضغط حفظ التعديلات");
  };

  const deliveryZones = useMemo(
    () => parseDeliveryZones(settings.deliveryZones),
    [settings.deliveryZones],
  );

  const setDeliveryZones = (zones: DeliveryZone[]) => {
    setSettings((current) => ({
      ...current,
      deliveryZones: serializeDeliveryZones(zones),
    }));
  };

  const addDeliveryZone = () => {
    const nextNumber = deliveryZones.length + 1;
    setDeliveryZones([
      ...deliveryZones,
      {
        id: `zone-${Date.now()}`,
        nameAr: `زون ${nextNumber}`,
        nameEn: `Zone ${nextNumber}`,
        areasAr: "",
        areasEn: "",
        fee: 0,
        minimumOrder: 0,
        freeDeliveryThreshold: 0,
        etaMinutes: 45,
        active: true,
      },
    ]);
    setNotice("تمت إضافة زون جديدة، اكتب المناطق والسعر ثم احفظ التعديلات");
  };

  const updateDeliveryZone = (
    id: string,
    patch: Partial<DeliveryZone>,
  ) => {
    setDeliveryZones(
      deliveryZones.map((zone) =>
        zone.id === id ? { ...zone, ...patch } : zone,
      ),
    );
  };

  const removeDeliveryZone = (id: string) => {
    setDeliveryZones(deliveryZones.filter((zone) => zone.id !== id));
  };

  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [offerScope, setOfferScope] = useState<"all" | "category" | "products">("all");
  const [offerScopeCategory, setOfferScopeCategory] = useState("");
  const [offerProductSearch, setOfferProductSearch] = useState("");
  const [offerShowEnglish, setOfferShowEnglish] = useState(false);
  const [offerValidationErrors, setOfferValidationErrors] = useState<string[]>([]);

  const startEditingOffer = (offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    setEditingOfferId(offerId);
    setOfferShowEnglish(false);
    setOfferProductSearch("");
    setOfferValidationErrors([]);
    if (offer?.linkedProductIds && offer.linkedProductIds.length > 0) {
      const allProductIds = products.map((p) => p.id);
      const linkedAreProducts = offer.linkedProductIds.some((id) => allProductIds.includes(id));
      const linkedAreCategories = offer.linkedProductIds.some((id) => categories.some((c) => c.id === id));
      if (linkedAreCategories) {
        setOfferScope("category");
        setOfferScopeCategory(offer.linkedProductIds[0] || "");
      } else if (linkedAreProducts) {
        setOfferScope("products");
        setOfferScopeCategory("");
      } else {
        setOfferScope("all");
        setOfferScopeCategory("");
      }
    } else {
      setOfferScope("all");
      setOfferScopeCategory("");
    }
  };

  const addOffer = () => {
    const id = `offer-${Date.now()}`;
    const newOffer: Offer = {
      id,
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      imageUrl: "",
      mobileImageUrl: "",
      offerType: "percentage",
      priceBeforeDiscount: 0,
      priceAfterDiscount: 0,
      discountType: "percentage",
      discountValue: 0,
      startDate: "",
      endDate: "",
      sortOrder: offers.length,
      active: true,
      featured: false,
      actionTextAr: "اطلب الآن",
      actionTextEn: "Order Now",
      actionUrl: "/menu",
      linkedProductIds: [],
    };
    setOffers((current) => [newOffer, ...current]);
    startEditingOffer(id);
    setNotice("تمت إضافة عرض جديد، كمّل بياناته ثم اضغط حفظ التعديلات");
  };

  const updateOffer = (id: string, patch: Partial<Offer>) => {
    setOffers((current) =>
      current.map((offer) =>
        offer.id === id ? { ...offer, ...patch } : offer,
      ),
    );
  };

  const offerImageInputRef = useRef<HTMLInputElement>(null);
  const offerMobileImageInputRef = useRef<HTMLInputElement>(null);

  const handleOfferImageUpload = (offerId: string, field: "imageUrl" | "mobileImageUrl", file: File) => {
    if (!file.type.startsWith("image/")) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setOfferValidationErrors((prev) => [...prev, "حجم الصورة يجب أن يكون أقل من 2 ميجا"]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = field === "mobileImageUrl" ? 600 : 1200;
        const maxH = field === "mobileImageUrl" ? 800 : 800;
        let w = img.width;
        let h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        if (h > maxH) { w = (w * maxH) / h; h = maxH; }
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        updateOffer(offerId, { [field]: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeOffer = (id: string) => {
    setOffers((current) => current.filter((offer) => offer.id !== id));
    setDeleteConfirmId(null);
    setEditingOfferId(null);
    setNotice("تم حذف العرض");
  };

  const validateAndSaveOffer = (offer: Offer) => {
    const errors: string[] = [];
    if (!offer.titleAr.trim()) errors.push("اسم العرض بالعربي مطلوب");
    if (!offer.imageUrl) errors.push("صورة العرض مطلوبة");
    if (offer.discountValue <= 0) errors.push("قيمة الخصم مطلوبة وأكبر من صفر");
    if (offer.discountType === "percentage" && offer.discountValue > 100) errors.push("نسبة الخصم لا تتجاوز 100%");
    if (offerScope === "category" && !offerScopeCategory) errors.push("يجب اختيار تصنيف");
    if (offerScope === "products" && (!offer.linkedProductIds || offer.linkedProductIds.length === 0)) errors.push("يجب اختيار منتج واحد على الأقل");
    setOfferValidationErrors(errors);
    if (errors.length === 0) setEditingOfferId(null);
  };

  const moveOffer = (id: string, direction: "up" | "down") => {
    setOffers((current) => {
      const sorted = [...current].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const index = sorted.findIndex((o) => o.id === id);
      if (index < 0) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return current;
      const temp = sorted[index].sortOrder ?? index;
      sorted[index] = { ...sorted[index], sortOrder: sorted[targetIndex].sortOrder ?? targetIndex };
      sorted[targetIndex] = { ...sorted[targetIndex], sortOrder: temp };
      return sorted;
    });
  };

  const addJourneyCity = () => {
    const id = `city-${Date.now()}`;
    setJourneyCities((current) => [
      ...current,
      {
        id,
        nameAr: "",
        nameEn: "",
        productAr: "",
        productEn: "",
        descAr: "",
        descEn: "",
        unit: "كيلو كامل",
        unitEn: "Full kg",
        image: "/assets/jahez/logo.jpg",
        linkTo: "/menu",
        x: 50,
        y: 50,
        active: true,
        sortOrder: current.length,
      },
    ]);
    setNotice("تمت إضافة مدينة جديدة، كمّل بياناتها ثم اضغط حفظ التعديلات");
  };

  const updateJourneyCity = (id: string, patch: Partial<JourneyCity>) => {
    setJourneyCities((current) =>
      current.map((city) =>
        city.id === id ? { ...city, ...patch } : city,
      ),
    );
  };

  const removeJourneyCity = (id: string) => {
    setJourneyCities((current) => current.filter((city) => city.id !== id));
    setNotice("تم حذف المدينة");
  };

  const updateOrderStatus = async (
    orderId: number,
    patch: { orderStatus?: string; paymentStatus?: string },
  ) => {
    setNotice("");
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, ...patch }),
      });
      if (!response.ok) throw new Error("status");
      setOrders((current) => {
        const updated = current.map((order) =>
          order.id === orderId ? { ...order, ...patch } : order,
        );
        const remaining = updated.filter(
          (order) => (order.orderStatus || "new") === "new",
        ).length;
        if (remaining === 0 && alertInterval) stopRepeatingAlert();
        return updated;
      });
      setNotice(
        patch.orderStatus ? "تم تحديث حالة الطلب" : "تم تحديث حالة الدفع",
      );
      window.setTimeout(() => setNotice(""), 2200);
    } catch {
      setNotice("تعذر تحديث حالة الطلب");
    }
  };

  const nav: Array<{ id: Tab; label: string; icon: string }> =
    role === "order_receiver"
      ? [{ id: "orders", label: "الطلبات", icon: "◫" }]
      : [
          { id: "overview", label: "نظرة عامة", icon: "⌂" },
          { id: "orders", label: "الطلبات", icon: "◫" },
          { id: "catalog", label: "المنيو والصور", icon: "▦" },
          { id: "payments", label: "الدفع والتوصيل", icon: "◎" },
          { id: "identity", label: "الهوية والمحتوى", icon: "✦" },
          { id: "offers", label: "العروض", icon: "★" },
          { id: "customers", label: "العملاء", icon: "◉" },
          { id: "analytics", label: "التحليلات", icon: "◎" },
          ...(canManageUsers
            ? ([{ id: "users", label: "المستخدمون والصلاحيات", icon: "♙" }] as const)
            : []),
        ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Image
            src="/assets/jahez/logo.jpg"
            alt="Jahez"
            width={190}
            height={48}
          />
          <span>CONTROL ROOM</span>
        </div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              <b>{item.icon}</b>
              {item.label}
              {item.id === "orders" && newOrdersCount > 0 && (
                <i className="admin-order-badge">{newOrdersCount}</i>
              )}
            </button>
          ))}
        </nav>
        <a className="admin-view-site" href="/" target="_blank">
          فتح الموقع ↗
        </a>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>أهلًا، {userName}</span>
            <h1>{nav.find((item) => item.id === tab)?.label}</h1>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-sound-controls">
              <button
                type="button"
                className={`admin-sound-button ${soundEnabled ? "enabled" : ""}`}
                onClick={() => {
                  if (soundEnabled) {
                    stopRepeatingAlert();
                    setSoundEnabled(false);
                  } else {
                    playOrderAlert();
                    setSoundEnabled(true);
                  }
                }}
              >
                {soundEnabled ? "الصوت مفعّل" : "الصوت متوقف"}
              </button>
              <select
                className="admin-sound-select"
                value={soundId}
                onChange={(e) => {
                  const id = e.target.value as SoundId;
                  currentSoundId = id;
                  setSoundId(id);
                  try { localStorage.setItem(SOUND_STORAGE_KEY, id); } catch {}
                  playOrderAlert();
                }}
              >
                {(Object.keys(SOUND_LIBRARY) as SoundId[]).map((id) => (
                  <option key={id} value={id}>
                    {SOUND_LIBRARY[id].label}
                  </option>
                ))}
              </select>
            </div>
            {canManage && (
              <button onClick={save} disabled={saving || loading}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            )}
          </div>
        </header>

        {notice && <div className="admin-notice">{notice}</div>}
        {loading ? (
          <div className="admin-loading">جاري تجهيز لوحة التحكم...</div>
        ) : (
          <>
            {tab === "overview" && (
              <section className="admin-overview">
                <div className="admin-metrics">
                  <article>
                    <span>إجمالي العملاء</span>
                    <strong>{customers.length}</strong>
                    <small>عميل مسجل</small>
                  </article>
                  <article>
                    <span>الطلبات المحفوظة</span>
                    <strong>{orders.length}</strong>
                    <small>من الموقع</small>
                  </article>
                  <article>
                    <span>قيمة الطلبات</span>
                    <strong>{formatPrice(totalRevenue)}</strong>
                    <small>قبل رسوم التوصيل</small>
                  </article>
                  <article>
                    <span>موافقات التسويق</span>
                    <strong>{marketingCustomers}</strong>
                    <small>موافقة اختيارية</small>
                  </article>
                </div>
                <div className="admin-panel admin-welcome">
                  <div>
                    <span>JAHEZ DATA HUB</span>
                    <h2>كل قرار أوضح لما الداتا تبقى قدامك</h2>
                    <p>
                      راقب العملاء والطلبات، حدّث الأسعار والصور، وتحكم في هوية
                      الموقع من مكان واحد.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {tab === "catalog" && (
              <section className="admin-panel">
                <div className="admin-section-head">
                  <div>
                    <span>MENU MANAGEMENT</span>
                    <h2>إضافة وتعديل المنيو</h2>
                  </div>
                  <div className="admin-section-actions">
                    <p>{products.length} صنف</p>
                    <button
                      type="button"
                      className="admin-add-product"
                      onClick={addProduct}
                    >
                      + إضافة صنف
                    </button>
                  </div>
                </div>
                <div className="admin-product-list">
                  {products.map((product) => (
                    <article key={product.id}>
                      <div className="admin-product-summary">
                        <div className="admin-product-photo">
                          <Image
                            src={product.image || "/assets/jahez/logo.jpg"}
                            alt={product.name}
                            fill
                          />
                        </div>
                        <div className="admin-product-name">
                          <span>{product.id}</span>
                          <b>{product.name}</b>
                          <small>{product.nameEn}</small>
                        </div>
                      </div>
                      <div className="admin-product-editor">
                        <label>
                          <span>القسم</span>
                          <select
                            value={product.category}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                category: event.target.value as Product["category"],
                              })
                            }
                          >
                            {categories.map((category) => (
                              <option value={category.id} key={category.id}>
                                {category.label} · {category.labelEn}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>السعر</span>
                          <input
                            type="number"
                            min="0"
                            max="100000"
                            value={product.price}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                price: Number(event.target.value),
                              })
                            }
                          />
                        </label>
                        <label>
                          <span>وحدة البيع بالعربي</span>
                          <input
                            maxLength={60}
                            value={product.unit}
                            onChange={(event) =>
                              updateProduct(product.id, { unit: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          <span>وحدة البيع بالإنجليزي</span>
                          <input
                            dir="ltr"
                            maxLength={60}
                            value={product.unitEn}
                            onChange={(event) =>
                              updateProduct(product.id, { unitEn: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          <span>الاسم بالعربي</span>
                          <input
                            maxLength={90}
                            value={product.name}
                            onChange={(event) =>
                              updateProduct(product.id, { name: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          <span>الاسم بالإنجليزي</span>
                          <input
                            dir="ltr"
                            maxLength={90}
                            value={product.nameEn}
                            onChange={(event) =>
                              updateProduct(product.id, { nameEn: event.target.value })
                            }
                          />
                        </label>
                        <label className="admin-wide-field">
                          <span>الوصف بالعربي</span>
                          <textarea
                            maxLength={240}
                            value={product.description}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                description: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="admin-wide-field">
                          <span>الوصف بالإنجليزي</span>
                          <textarea
                            dir="ltr"
                            maxLength={240}
                            value={product.descriptionEn || ""}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                descriptionEn: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="admin-image-field admin-wide-field">
                          <span>رابط الصورة</span>
                          <input
                            dir="ltr"
                            maxLength={1000}
                            value={product.image || ""}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                image: event.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="admin-product-flags">
                          <label className="admin-check">
                            <input
                              type="checkbox"
                              checked={product.featured === true}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  featured: event.target.checked,
                                })
                              }
                            />
                            <span>مميز</span>
                          </label>
                          <label className="admin-check">
                            <input
                              type="checkbox"
                              checked={product.spicy === true}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  spicy: event.target.checked,
                                })
                              }
                            />
                            <span>حار</span>
                          </label>
                          <label className="admin-check">
                            <input
                              type="checkbox"
                              checked={product.active !== false}
                              onChange={(event) =>
                                updateProduct(product.id, {
                                  active: event.target.checked,
                                })
                              }
                            />
                            <span>ظاهر للعملاء</span>
                          </label>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {tab === "payments" && (
              <section className="admin-panel">
                <div className="admin-section-head">
                  <div>
                    <span>CHECKOUT CONTROL</span>
                    <h2>الدفع ورسوم التوصيل</h2>
                  </div>
                  <p>الإعدادات تُطبّق على صفحة الطلب مباشرة</p>
                </div>
                <div className="payment-admin-grid">
                  <div className="admin-settings-card delivery-zones-card">
                    <div className="delivery-zones-head">
                      <div>
                        <span>DELIVERY ZONES</span>
                        <h3>زونز التوصيل</h3>
                      </div>
                      <button type="button" onClick={addDeliveryZone}>
                        + إضافة زون
                      </button>
                    </div>
                    <p className="admin-helper">
                      العميل يختار الزون، والسعر والحد الأدنى بيتحسبوا تلقائيًا
                      ويتراجعوا على السيرفر قبل تسجيل الطلب
                    </p>
                    {deliveryZones.length === 0 ? (
                      <div className="delivery-zones-empty">
                        لم تتم إضافة زونز بعد. السعر الثابت القديم يظل مطبقًا
                        لحين إضافة أول زون وحفظها.
                      </div>
                    ) : (
                      <div className="delivery-zones-list">
                        {deliveryZones.map((zone, index) => (
                          <article key={zone.id} className="delivery-zone-editor">
                            <div className="delivery-zone-title">
                              <strong>زون {index + 1}</strong>
                              <label className="admin-zone-toggle">
                                <input
                                  type="checkbox"
                                  checked={zone.active}
                                  onChange={(event) =>
                                    updateDeliveryZone(zone.id, {
                                      active: event.target.checked,
                                    })
                                  }
                                />
                                <span>مفعّلة</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeDeliveryZone(zone.id)}
                              >
                                حذف
                              </button>
                            </div>
                            <div className="delivery-zone-fields">
                              <label>
                                <span>اسم الزون بالعربي</span>
                                <input
                                  value={zone.nameAr}
                                  maxLength={100}
                                  onChange={(event) =>
                                    updateDeliveryZone(zone.id, {
                                      nameAr: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>اسم الزون بالإنجليزي</span>
                                <input
                                  value={zone.nameEn}
                                  maxLength={100}
                                  dir="ltr"
                                  onChange={(event) =>
                                    updateDeliveryZone(zone.id, {
                                      nameEn: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label className="zone-wide">
                                <span>المناطق التابعة بالعربي</span>
                                <input
                                  value={zone.areasAr}
                                  maxLength={300}
                                  placeholder="مثال: التجمع الأول، الخامس، الرحاب"
                                  onChange={(event) =>
                                    updateDeliveryZone(zone.id, {
                                      areasAr: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label className="zone-wide">
                                <span>المناطق التابعة بالإنجليزي</span>
                                <input
                                  value={zone.areasEn}
                                  maxLength={300}
                                  dir="ltr"
                                  placeholder="First Settlement, Fifth Settlement, Rehab"
                                  onChange={(event) =>
                                    updateDeliveryZone(zone.id, {
                                      areasEn: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              {zoneNumberFields.map(({ key, label }) => (
                                <label key={key}>
                                  <span>{label}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    dir="ltr"
                                    value={zone[key]}
                                    onChange={(event) =>
                                      updateDeliveryZone(zone.id, {
                                        [key]: Math.max(
                                          0,
                                          Number(event.target.value) || 0,
                                        ),
                                      })
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="admin-settings-card">
                    <div>
                      <span>PAYMENT METHODS</span>
                      <h3>طرق الدفع المتاحة</h3>
                    </div>
                    <label className="admin-payment-toggle">
                      <input
                        type="checkbox"
                        checked={settings.cashOnDeliveryEnabled === "true"}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            cashOnDeliveryEnabled: String(event.target.checked),
                          }))
                        }
                      />
                      <span>
                        <b>كاش عند الاستلام</b>
                        <small>الطلب يتسجل ثم ينتقل لواتساب للتأكيد</small>
                      </span>
                    </label>
                    <label className="admin-payment-toggle">
                      <input
                        type="checkbox"
                        checked={settings.instapayEnabled === "true"}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            instapayEnabled: String(event.target.checked),
                          }))
                        }
                      />
                      <span>
                        <b>InstaPay</b>
                        <small>يظهر الحساب والمبلغ ورقم الطلب للعميل</small>
                      </span>
                    </label>
                    <label>
                      <span>حساب إنستاباي أو رقم التحويل</span>
                      <input
                        value={settings.instapayAccount}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            instapayAccount: event.target.value,
                          }))
                        }
                        placeholder="username@instapay أو رقم الموبايل"
                        dir="ltr"
                      />
                    </label>
                    <label>
                      <span>رابط دفع إنستاباي (اختياري)</span>
                      <input
                        type="url"
                        value={settings.instapayPaymentLink}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            instapayPaymentLink: event.target.value,
                          }))
                        }
                        placeholder="https://..."
                        dir="ltr"
                      />
                    </label>
                    <label
                      className={`admin-payment-toggle ${
                        paymobConfigured ? "" : "disabled"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!paymobConfigured}
                        checked={
                          paymobConfigured &&
                          settings.paymobEnabled === "true"
                        }
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            paymobEnabled: String(event.target.checked),
                          }))
                        }
                      />
                      <span>
                        <b>فيزا أونلاين عبر Paymob</b>
                        <small>
                          {paymobConfigured
                            ? "بيانات الربط مؤمّنة وجاهزة للتفعيل"
                            : "بيانات الربط غير مكتملة؛ راجع القائمة بالأسفل"}
                        </small>
                      </span>
                    </label>
                    <div className="paymob-credentials-status">
                      <b>حالة بيانات Paymob</b>
                      {[
                        ["Public Key", paymobStatus?.publicKey],
                        ["API Key", paymobStatus?.apiKey],
                        ["Card Integration ID", paymobStatus?.integrationId],
                        ["Iframe ID", paymobStatus?.iframeId],
                        ["HMAC Secret", paymobStatus?.hmacSecret],
                      ].map(([label, ready]) => (
                        <span
                          key={String(label)}
                          className={ready ? "ready" : "missing"}
                        >
                          <i>{ready ? "✓" : "!"}</i>
                          {String(label)}
                          <small>{ready ? "مضاف" : "ناقص"}</small>
                        </span>
                      ))}
                      <p>
                        المفاتيح السرية لا تُكتب داخل لوحة الإدارة، ولا تظهر
                        لأي مستخدم. تُحفظ في أسرار الاستضافة فقط.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="admin-settings-card" style={{ marginTop: 16 }}>
                  <div>
                    <span>ORDER SCHEDULING</span>
                    <h3>الحجز والاستلام</h3>
                  </div>
                  <p className="admin-helper">
                    حددي أقل مدة تجهيز مطلوبة قبل موعد الطلب، وعنوان الاستلام الظاهر للعميل.
                  </p>
                  <div className="delivery-zone-fields">
                    <label>
                      <span>أقل مدة تجهيز بالساعات</span>
                      <input
                        type="number"
                        min="0"
                        max="168"
                        step="1"
                        value={settings.orderLeadHours || "24"}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            orderLeadHours: String(Math.max(0, Number(event.target.value) || 0)),
                          }))
                        }
                        dir="ltr"
                      />
                    </label>
                    <label className="zone-wide">
                      <span>عنوان الاستلام بالعربي</span>
                      <input
                        value={settings.pickupAddressAr || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            pickupAddressAr: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="zone-wide">
                      <span>عنوان الاستلام بالإنجليزي</span>
                      <input
                        dir="ltr"
                        value={settings.pickupAddressEn || ""}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            pickupAddressEn: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="admin-settings-card" style={{ marginTop: 16 }}>
                  <div>
                    <span>BUSINESS HOURS</span>
                    <h3>مواعيد العمل</h3>
                  </div>
                  <p className="admin-helper">
                    الصوت والتنبيهات بتشتغل في المواعيد دي بس
                  </p>
                  <div className="delivery-zone-fields">
                    <label>
                      <span>وقت الفتح</span>
                      <input
                        type="time"
                        value={settings.openTime || "11:00"}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            openTime: event.target.value,
                          }))
                        }
                        dir="ltr"
                      />
                    </label>
                    <label>
                      <span>وقت الإغلاق</span>
                      <input
                        type="time"
                        value={settings.closeTime || "02:00"}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            closeTime: event.target.value,
                          }))
                        }
                        dir="ltr"
                      />
                    </label>
                  </div>
                </div>
              </section>
            )}

            {tab === "identity" && (
              <section className="admin-panel">
                <div className="admin-section-head">
                  <div>
                    <span>BRAND CONTROL</span>
                    <h2>الهوية والمحتوى الأساسي</h2>
                  </div>
                </div>
                <div className="identity-grid">
                  {[
                    ["primaryColor", "الأخضر الداكن"],
                    ["accentColor", "الذهبي"],
                    ["creamColor", "الأوف وايت"],
                  ].map(([key, label]) => (
                    <label className="color-field" key={key}>
                      <span>{label}</span>
                      <div>
                        <input
                          type="color"
                          value={String(settings[key as keyof SiteSettings])}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                        />
                        <input
                          value={String(settings[key as keyof SiteSettings])}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          dir="ltr"
                        />
                      </div>
                    </label>
                  ))}
                  <label>
                    <span>رقم واتساب الدولي</span>
                    <input
                      value={settings.whatsappNumber}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          whatsappNumber: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      dir="ltr"
                    />
                  </label>
                  <label>
                    <span>رابط اتجاهات Google Maps</span>
                    <input
                      type="url"
                      value={settings.mapsUrl}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          mapsUrl: event.target.value,
                        }))
                      }
                      dir="ltr"
                    />
                  </label>
                  <label>
                    <span>العنوان الرئيسي بالعربي</span>
                    <input
                      value={settings.heroTitleAr}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          heroTitleAr: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>العنوان الرئيسي بالإنجليزي</span>
                    <input
                      value={settings.heroTitleEn}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          heroTitleEn: event.target.value,
                        }))
                      }
                      dir="ltr"
                    />
                  </label>
                  <label>
                    <span>الوصف بالعربي</span>
                    <textarea
                      value={settings.taglineAr}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          taglineAr: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>الوصف بالإنجليزي</span>
                    <textarea
                      value={settings.taglineEn}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          taglineEn: event.target.value,
                        }))
                      }
                      dir="ltr"
                    />
                  </label>
                </div>
              </section>
            )}

            {tab === "offers" && (
              <section className="admin-panel">
                <div className="admin-section-head">
                  <div>
                    <span>OFFERS MANAGEMENT</span>
                    <h2>إدارة العروض</h2>
                  </div>
                  {!editingOfferId && (
                    <div className="admin-section-actions">
                      <p>{offers.length} عرض</p>
                      <button type="button" className="admin-add-product" onClick={addOffer}>
                        + إضافة عرض
                      </button>
                    </div>
                  )}
                </div>

                {editingOfferId ? (() => {
                  const offer = offers.find((o) => o.id === editingOfferId);
                  if (!offer) return null;
                  return (
                    <div className="offer-editor-wrap">
                      {offerValidationErrors.length > 0 && (
                        <div className="offer-validation-errors">
                          {offerValidationErrors.map((err, i) => (
                            <span key={i}>⚠ {err}</span>
                          ))}
                        </div>
                      )}

                      <div className="offer-editor-body">
                        <div className="offer-editor-main">

                          <div className="offer-section">
                            <span className="offer-section-label">بيانات العرض</span>
                            <label>
                              <span>اسم العرض بالعربي *</span>
                              <input
                                value={offer.titleAr}
                                maxLength={100}
                                placeholder="مثال: خصم 15% على أصناف مختارة"
                                onChange={(e) => updateOffer(offer.id, { titleAr: e.target.value })}
                              />
                            </label>
                            <label className="admin-wide-field">
                              <span>وصف مختصر بالعربي</span>
                              <input
                                maxLength={240}
                                value={offer.descriptionAr}
                                placeholder="وصف قصير يظهر تحت اسم العرض"
                                onChange={(e) => updateOffer(offer.id, { descriptionAr: e.target.value })}
                              />
                            </label>

                            <div className="offer-image-uploads">
                              <div
                                className="offer-dropzone"
                                onClick={() => offerImageInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); if (e.dataTransfer.files[0]) handleOfferImageUpload(offer.id, "imageUrl", e.dataTransfer.files[0]); }}
                              >
                                {offer.imageUrl ? (
                                  <img src={offer.imageUrl} alt="صورة العرض" />
                                ) : (
                                  <>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                    <span>اسحب الصورة هنا أو اضغط للاختيار *</span>
                                    <small>الحد الأقصى 2 ميجا، يُفضّل WebP أو JPG</small>
                                  </>
                                )}
                                <input
                                  ref={offerImageInputRef}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(e) => { if (e.target.files?.[0]) handleOfferImageUpload(offer.id, "imageUrl", e.target.files[0]); e.target.value = ""; }}
                                />
                              </div>
                              <div
                                className="offer-dropzone small"
                                onClick={() => offerMobileImageInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); if (e.dataTransfer.files[0]) handleOfferImageUpload(offer.id, "mobileImageUrl", e.dataTransfer.files[0]); }}
                              >
                                {offer.mobileImageUrl ? (
                                  <img src={offer.mobileImageUrl} alt="صورة الموبايل" />
                                ) : (
                                  <>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                                    <span>صورة الموبايل (اختياري)</span>
                                    <small>تظهر على الشاشات الصغيرة، وإلا تُستخدم صورة الديسكتوب</small>
                                  </>
                                )}
                                <input
                                  ref={offerMobileImageInputRef}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(e) => { if (e.target.files?.[0]) handleOfferImageUpload(offer.id, "mobileImageUrl", e.target.files[0]); e.target.value = ""; }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              className="offer-english-toggle"
                              onClick={() => setOfferShowEnglish(!offerShowEnglish)}
                            >
                              {offerShowEnglish ? "▼" : "▶"} النسخة الإنجليزية
                            </button>
                            {offerShowEnglish && (
                              <div className="offer-english-fields">
                                <label>
                                  <span>الاسم بالإنجليزي</span>
                                  <input dir="ltr" maxLength={100} value={offer.titleEn} onChange={(e) => updateOffer(offer.id, { titleEn: e.target.value })} />
                                </label>
                                <label className="admin-wide-field">
                                  <span>الوصف بالإنجليزي</span>
                                  <input dir="ltr" maxLength={240} value={offer.descriptionEn} onChange={(e) => updateOffer(offer.id, { descriptionEn: e.target.value })} />
                                </label>
                              </div>
                            )}
                          </div>

                          <div className="offer-section">
                            <span className="offer-section-label">الخصم</span>
                            <div className="offer-discount-type-toggle">
                              <button
                                type="button"
                                className={offer.discountType === "percentage" ? "active" : ""}
                                onClick={() => updateOffer(offer.id, { discountType: "percentage", discountValue: 0 })}
                              >
                                نسبة مئوية %
                              </button>
                              <button
                                type="button"
                                className={offer.discountType === "flat" ? "active" : ""}
                                onClick={() => updateOffer(offer.id, { discountType: "flat", discountValue: 0 })}
                              >
                                مبلغ ثابت ج.م
                              </button>
                            </div>
                            <label>
                              <span>{offer.discountType === "percentage" ? "نسبة الخصم (%)" : "قيمة الخصم (ج.م)"}</span>
                              <input
                                type="number"
                                min="1"
                                max={offer.discountType === "percentage" ? "99" : "100000"}
                                value={offer.discountValue || ""}
                                placeholder={offer.discountType === "percentage" ? "مثال: 25" : "مثال: 50"}
                                onChange={(e) => updateOffer(offer.id, { discountValue: Number(e.target.value) })}
                              />
                            </label>
                          </div>

                          <div className="offer-section">
                            <span className="offer-section-label">المنتجات</span>
                            <div className="offer-scope-radios">
                              <label className="offer-radio">
                                <input type="radio" name={`scope-${offer.id}`} checked={offerScope === "all"} onChange={() => { setOfferScope("all"); updateOffer(offer.id, { linkedProductIds: [] }); }} />
                                <span>كل المينيو</span>
                              </label>
                              <label className="offer-radio">
                                <input type="radio" name={`scope-${offer.id}`} checked={offerScope === "category"} onChange={() => { setOfferScope("category"); setOfferScopeCategory(""); }} />
                                <span>تصنيف محدد</span>
                              </label>
                              <label className="offer-radio">
                                <input type="radio" name={`scope-${offer.id}`} checked={offerScope === "products"} onChange={() => { setOfferScope("products"); }} />
                                <span>منتجات محددة</span>
                              </label>
                            </div>
                            {offerScope === "category" && (
                              <label>
                                <span>اختر التصنيف</span>
                                <select
                                  value={offerScopeCategory}
                                  onChange={(e) => {
                                    const catId = e.target.value;
                                    setOfferScopeCategory(catId);
                                    const catProductIds = products.filter((p) => p.category === catId).map((p) => p.id);
                                    updateOffer(offer.id, { linkedProductIds: catProductIds });
                                  }}
                                >
                                  <option value="">— اختر تصنيف —</option>
                                  {categories.map((c) => (
                                    <option value={c.id} key={c.id}>{c.label} · {c.labelEn}</option>
                                  ))}
                                </select>
                              </label>
                            )}
                            {offerScope === "products" && (
                              <div className="offer-product-picker">
                                <input
                                  dir="rtl"
                                  placeholder="ابحث عن منتج بالاسم..."
                                  value={offerProductSearch}
                                  onChange={(e) => setOfferProductSearch(e.target.value)}
                                />
                                <div className="offer-product-list">
                                  {products
                                    .filter((p) => {
                                      if (!offerProductSearch) return true;
                                      const q = offerProductSearch.toLowerCase();
                                      return p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
                                    })
                                    .map((p) => {
                                      const selected = offer.linkedProductIds?.includes(p.id) || false;
                                      return (
                                        <label key={p.id} className={`offer-product-item ${selected ? "selected" : ""}`}>
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => {
                                              const current = offer.linkedProductIds || [];
                                              const next = selected ? current.filter((id) => id !== p.id) : [...current, p.id];
                                              updateOffer(offer.id, { linkedProductIds: next });
                                            }}
                                          />
                                          <Image src={p.image || "/assets/jahez/logo.jpg"} alt={p.name} width={36} height={36} />
                                          <div>
                                            <b>{p.name}</b>
                                            <small>{p.nameEn}</small>
                                          </div>
                                        </label>
                                      );
                                    })}
                                </div>
                                {offer.linkedProductIds && offer.linkedProductIds.length > 0 && (
                                  <small className="offer-selected-count">{offer.linkedProductIds.length} منتج محدد</small>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="offer-section">
                            <span className="offer-section-label">المدة والتفعيل</span>
                            <div className="offer-dates-row">
                              <label>
                                <span>تاريخ البداية *</span>
                                <input
                                  type="datetime-local"
                                  value={offer.startDate}
                                  onChange={(e) => updateOffer(offer.id, { startDate: e.target.value })}
                                />
                              </label>
                              <label>
                                <span>تاريخ النهاية (اختياري)</span>
                                <input
                                  type="datetime-local"
                                  value={offer.endDate}
                                  onChange={(e) => updateOffer(offer.id, { endDate: e.target.value })}
                                />
                              </label>
                            </div>
                            <label className="admin-check offer-active-check">
                              <input
                                type="checkbox"
                                checked={offer.active}
                                onChange={(e) => updateOffer(offer.id, { active: e.target.checked })}
                              />
                              <span>مفعّل</span>
                            </label>
                            <label className="admin-check offer-active-check">
                              <input
                                type="checkbox"
                                checked={!!offer.featured}
                                onChange={(e) => updateOffer(offer.id, { featured: e.target.checked })}
                              />
                              <span>مميّز (الصفحة الرئيسية)</span>
                            </label>
                          </div>
                        </div>

                        <div className="offer-editor-sidebar">
                          <span className="offer-section-label">ملخص العرض</span>
                          <div className="offer-preview-card">
                            {offer.imageUrl ? (
                              <div className="offer-preview-img"><img src={offer.imageUrl} alt={offer.titleAr || "عرض"} /></div>
                            ) : (
                              <div className="offer-preview-img placeholder">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                              </div>
                            )}
                            <div className="offer-preview-info">
                              <h4>{offer.titleAr || "اسم العرض"}</h4>
                              {offer.descriptionAr && <p>{offer.descriptionAr}</p>}
                              {offer.discountValue > 0 && (
                                <span className="admin-offer-discount-badge">
                                  {offer.discountType === "percentage" ? `${offer.discountValue}%` : `${offer.discountValue} ج.م`}
                                  <small>خصم</small>
                                </span>
                              )}
                              <div className="offer-preview-meta">
                                {offerScope === "all" && <span>كل المينيو</span>}
                                {offerScope === "category" && offerScopeCategory && (
                                  <span>{categories.find((c) => c.id === offerScopeCategory)?.label || offerScopeCategory}</span>
                                )}
                                {offerScope === "products" && offer.linkedProductIds && (
                                  <span>{offer.linkedProductIds.length} منتج</span>
                                )}
                                {offer.startDate && (
                                  <small>{new Date(offer.startDate).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}{offer.endDate ? ` — ${new Date(offer.endDate).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}` : ""}</small>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="offer-editor-actions">
                            <button
                              type="button"
                              className="offer-save-btn"
                              onClick={() => validateAndSaveOffer(offer)}
                            >
                              حفظ العرض
                            </button>
                            <button
                              type="button"
                              className="offer-cancel-btn"
                              onClick={() => setEditingOfferId(null)}
                            >
                              إلغاء
                            </button>
                            <button
                              type="button"
                              className="offer-delete-btn"
                              onClick={() => {
                                if (window.confirm("هل أنت متأكد من حذف هذا العرض؟")) removeOffer(offer.id);
                              }}
                            >
                              حذف العرض
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="admin-offers-grid">
                    {offers.length === 0 ? (
                      <div className="admin-empty-state">لم تتم إضافة عروض بعد</div>
                    ) : (
                      [...offers]
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map((offer, sortIndex) => {
                          const isExpired = offer.endDate ? new Date(offer.endDate) < new Date() : false;
                          return (
                            <article key={offer.id} className="admin-offer-card">
                              <div className="admin-offer-preview">
                                {offer.imageUrl ? (
                                  <Image src={offer.imageUrl} alt={offer.titleAr || "عرض"} fill />
                                ) : (
                                  <div className="admin-offer-placeholder">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                  </div>
                                )}
                                <div className="admin-offer-card-overlay">
                                  <span className="admin-offer-badge">{isExpired ? "منتهي" : offer.active ? "مفعّل" : "متوقف"}</span>
                                  {sortIndex > 0 && (
                                    <button type="button" className="admin-offer-sort-btn" onClick={() => moveOffer(offer.id, "up")} title="تحريك لأعلى">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                                    </button>
                                  )}
                                  {sortIndex < offers.length - 1 && (
                                    <button type="button" className="admin-offer-sort-btn" onClick={() => moveOffer(offer.id, "down")} title="تحريك لأسفل">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="admin-offer-card-info">
                                <div className="admin-offer-card-titles">
                                  <h3>{offer.titleAr || offer.titleEn || "عرض جديد"}</h3>
                                  <small>{offer.titleEn}</small>
                                </div>
                                <div className="admin-offer-card-meta">
                                  {offer.discountValue > 0 && (
                                    <span className="admin-offer-discount-badge">
                                      {offer.discountType === "percentage" ? `${offer.discountValue}%` : `${offer.discountValue} ج.م`}
                                      <small>خصم</small>
                                    </span>
                                  )}
                                  {offer.startDate && offer.endDate && (
                                    <small className="admin-offer-dates">
                                      {new Date(offer.startDate).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                                      {" — "}
                                      {new Date(offer.endDate).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                                    </small>
                                  )}
                                </div>
                                <div className="admin-offer-card-actions">
                                  <label className="admin-offer-active-toggle inline-toggle">
                                    <input
                                      type="checkbox"
                                      checked={offer.active}
                                      onChange={(e) => updateOffer(offer.id, { active: e.target.checked })}
                                    />
                                    <span>{offer.active ? "مفعّل" : "متوقف"}</span>
                                  </label>
                                  <div className="admin-offer-action-btns">
                                    <button type="button" className="admin-offer-edit-btn" onClick={() => startEditingOffer(offer.id)}>
                                      تعديل
                                    </button>
                                    {deleteConfirmId === offer.id ? (
                                      <div className="admin-offer-delete-confirm">
                                        <span>تأكيد الحذف؟</span>
                                        <button type="button" className="admin-offer-delete-yes" onClick={() => removeOffer(offer.id)}>نعم</button>
                                        <button type="button" className="admin-offer-delete-no" onClick={() => setDeleteConfirmId(null)}>لا</button>
                                      </div>
                                    ) : (
                                      <button type="button" className="admin-offer-delete-btn" onClick={() => setDeleteConfirmId(offer.id)}>
                                        حذف
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })
                    )}
                  </div>
                )}
              </section>
            )}


            {tab === "cities" && (
              <section className="admin-panel">
                <div className="admin-section-head">
                  <div>
                    <span>JOURNEY CITIES</span>
                    <h2>إدارة مدن الرحلة</h2>
                  </div>
                  <div className="admin-section-actions">
                    <p>{journeyCities.length} مدينة</p>
                    <button
                      type="button"
                      className="admin-add-product"
                      onClick={addJourneyCity}
                    >
                      + إضافة مدينة
                    </button>
                  </div>
                </div>
                <div className="admin-cities-list">
                  {journeyCities.length === 0 ? (
                    <div className="admin-empty-state">
                      لم تتم إضافة مدن بعد. اضغط إضافة مدينة للبدء.
                    </div>
                  ) : (
                    journeyCities
                      .slice()
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map((city) => (
                        <article key={city.id} className="admin-city-card">
                          <div className="admin-city-preview">
                            <div className="admin-city-map-preview">
                              <Image
                                src="/assets/brand/flavor-world-map.webp"
                                alt="Mini map"
                                width={400}
                                height={200}
                                className="admin-city-map-img"
                              />
                              <span
                                className="admin-city-preview-dot"
                                style={{ left: `${city.x}%`, top: `${city.y}%` }}
                              />
                            </div>
                          </div>
                          <div className="admin-city-fields">
                            <div className="admin-city-fields-row">
                              <label>
                                <span>الاسم بالعربي</span>
                                <input
                                  value={city.nameAr}
                                  maxLength={80}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      nameAr: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>الاسم بالإنجليزي</span>
                                <input
                                  dir="ltr"
                                  maxLength={80}
                                  value={city.nameEn}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      nameEn: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                            <div className="admin-city-fields-row">
                              <label>
                                <span>المنتج بالعربي</span>
                                <input
                                  value={city.productAr}
                                  maxLength={100}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      productAr: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>المنتج بالإنجليزي</span>
                                <input
                                  dir="ltr"
                                  maxLength={100}
                                  value={city.productEn}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      productEn: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                            <label className="admin-wide-field">
                              <span>الوصف بالعربي</span>
                              <input
                                maxLength={200}
                                value={city.descAr}
                                onChange={(e) =>
                                  updateJourneyCity(city.id, {
                                    descAr: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className="admin-wide-field">
                              <span>الوصف بالإنجليزي</span>
                              <input
                                dir="ltr"
                                maxLength={200}
                                value={city.descEn}
                                onChange={(e) =>
                                  updateJourneyCity(city.id, {
                                    descEn: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <div className="admin-city-fields-row">
                              <label>
                                <span>رابط الصورة</span>
                                <input
                                  dir="ltr"
                                  maxLength={500}
                                  value={city.image}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      image: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>رابط القائمة</span>
                                <input
                                  dir="ltr"
                                  maxLength={200}
                                  value={city.linkTo}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      linkTo: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                            <div className="admin-city-fields-row">
                              <label>
                                <span>X% (أفقي)</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  dir="ltr"
                                  value={city.x}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      x: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>Y% (عمودي)</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  dir="ltr"
                                  value={city.y}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      y: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>الترتيب</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  dir="ltr"
                                  value={city.sortOrder}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      sortOrder: Number(e.target.value) || 0,
                                    })
                                  }
                                />
                              </label>
                            </div>
                            <div className="admin-city-flags">
                              <label className="admin-check">
                                <input
                                  type="checkbox"
                                  checked={city.active !== false}
                                  onChange={(e) =>
                                    updateJourneyCity(city.id, {
                                      active: e.target.checked,
                                    })
                                  }
                                />
                                <span>مفعّلة</span>
                              </label>
                              <button
                                type="button"
                                className="admin-offer-delete"
                                onClick={() => {
                                  if (window.confirm("هل أنت متأكد من حذف هذه المدينة؟")) {
                                    removeJourneyCity(city.id);
                                  }
                                }}
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                  )}
                </div>
              </section>
            )}

            {tab === "customers" && (
              <CustomerSegments customers={customers} formatPrice={formatPrice} />
            )}

            {tab === "users" && canManageUsers && (
              <section className="admin-panel">
                <div className="admin-section-head">
                  <div>
                    <span>ACCESS CONTROL</span>
                    <h2>المستخدمون والصلاحيات</h2>
                  </div>
                  <button
                    type="button"
                    className="admin-add-product"
                    onClick={addStaffMember}
                  >
                    + إضافة حساب
                  </button>
                </div>
                <div className="admin-access-note">
                  <b>متلقي الطلبات</b>
                  <span>
                    يرى شاشة الطلبات فقط ويغيّر حالة الطلب، ولا يمكنه فتح
                    المنيو أو الأسعار أو العملاء أو إعدادات الدفع.
                  </span>
                </div>
                <div className="admin-users-list">
                  {staff.length === 0 ? (
                    <div className="admin-empty-state">
                      لم تتم إضافة حسابات للفريق بعد
                    </div>
                  ) : (
                    staff.map((member, index) => (
                      <article key={member.id || `new-${index}`}>
                        <label>
                          <span>اسم الموظف</span>
                          <input
                            value={member.name}
                            maxLength={90}
                            onChange={(event) =>
                              updateStaffMember(index, {
                                name: event.target.value,
                              })
                            }
                            placeholder="مثال: متلقي طلبات الفرع"
                          />
                        </label>
                        <label>
                          <span>البريد المستخدم في تسجيل الدخول</span>
                          <input
                            dir="ltr"
                            type="email"
                            value={member.email}
                            maxLength={160}
                            onChange={(event) =>
                              updateStaffMember(index, {
                                email: event.target.value,
                              })
                            }
                            placeholder="orders@jahez.local"
                          />
                        </label>
                        <label>
                          <span>الصلاحية</span>
                          <select
                            value={member.role}
                            onChange={(event) =>
                              updateStaffMember(index, {
                                role: event.target.value as StaffMember["role"],
                              })
                            }
                          >
                            <option value="order_receiver">متلقي الطلبات فقط</option>
                            <option value="admin">مدير لوحة التحكم</option>
                          </select>
                        </label>
                        <label className="admin-user-active">
                          <input
                            type="checkbox"
                            checked={member.active}
                            onChange={(event) =>
                              updateStaffMember(index, {
                                active: event.target.checked,
                              })
                            }
                          />
                          <span>{member.active ? "الحساب نشط" : "الحساب موقوف"}</span>
                        </label>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}

            {tab === "orders" && (
              <section className="admin-panel orders-control-panel">
                <div className="admin-section-head orders-section-head">
                  <div>
                    <span>LIVE ORDER CONTROL</span>
                    <h2>تشغيل الطلبات</h2>
                  </div>
                  <div className="orders-live-summary">
                    <span className={soundEnabled ? "sound-on" : "sound-off"}>
                      {soundEnabled ? "● الصوت يعمل" : "○ الصوت متوقف"}
                    </span>
                    <b>{newOrdersCount} جديد</b>
                    <p>{orders.length} طلب</p>
                  </div>
                </div>
                <div className="order-admin-grid">
                  {orders.length === 0 && (
                    <div className="admin-empty-state">
                      لا توجد طلبات حتى الآن
                    </div>
                  )}
                  {orders.map((order) => {
                    const customer = customers.find(
                      (item) => item.id === order.customerId,
                    );
                    const currentStatus = order.orderStatus || "new";
                    return (
                      <article
                        key={order.id}
                        className={currentStatus === "new" ? "is-new" : ""}
                      >
                        <div className="order-card-head">
                          <div>
                            <span>طلب #{order.id}</span>
                            <b>{customer?.name || "عميل"}</b>
                            <small>
                              {new Date(order.createdAt).toLocaleString("ar-EG")}
                            </small>
                          </div>
                          <span className={`order-status-chip ${currentStatus}`}>
                            {orderStatuses.find(
                              (status) => status.value === currentStatus,
                            )?.label || "طلب جديد"}
                          </span>
                        </div>
                        <p className="order-items-list">
                          {order.items
                            .map(
                              (item) =>
                                `${item.name || "صنف"} × ${item.quantity || 1}`,
                            )
                            .join("، ")}
                        </p>
                        <div className="order-customer-details">
                          {customer?.phone && (
                            <a dir="ltr" href={`tel:${customer.phone}`}>
                              {customer.phone}
                            </a>
                          )}
                          {order.address && <span>{order.address}</span>}
                          {order.notes && <small>ملاحظة: {order.notes}</small>}
                        </div>
                        <footer>
                          <span>
                            {order.fulfillment === "delivery"
                              ? `توصيل${
                                  order.deliveryZone
                                    ? ` · ${order.deliveryZone}`
                                    : ""
                                }`
                              : "استلام"}
                          </span>
                          <span>
                            {order.paymentMethod === "paymob"
                              ? "Paymob"
                              : order.paymentMethod === "instapay"
                                ? "InstaPay"
                                : "كاش"}
                            {" · "}
                            {order.paymentStatus === "paid"
                              ? "مدفوع"
                              : order.paymentStatus === "awaiting_transfer"
                                ? "بانتظار التحويل"
                                : order.paymentStatus === "payment_failed"
                                  ? "فشل الدفع"
                                  : "قيد التنفيذ"}
                          </span>
                          <b>{formatPrice(order.total || order.subtotal)}</b>
                        </footer>
                        <div className="order-status-actions">
                          <label>
                            <span>حالة الطلب</span>
                            <select
                              value={currentStatus}
                              onChange={(event) =>
                                updateOrderStatus(order.id, {
                                  orderStatus: event.target.value,
                                })
                              }
                            >
                              {orderStatuses.map((status) => (
                                <option value={status.value} key={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {customer?.phone && (
                            <a
                              href={`https://wa.me/${customer.phone.replace(/^0/, "20")}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              واتساب العميل
                            </a>
                          )}
                          {canManage && order.paymentStatus !== "paid" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order.id, {
                                  paymentStatus: "paid",
                                })
                              }
                            >
                              تأكيد الدفع
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {tab === "analytics" && <AnalyticsPanel />}
          </>
        )}
      </main>
    </div>
  );
}