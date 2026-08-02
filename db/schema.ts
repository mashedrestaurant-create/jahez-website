import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 90 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 160 }).notNull().default(""),
    area: varchar("area", { length: 100 }).notNull().default(""),
    birthday: varchar("birthday", { length: 10 }).notNull().default(""),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    ordersCount: integer("orders_count").notNull().default(0),
    totalSpent: real("total_spent").notNull().default(0),
  },
  (table) => [
    unique("customers_phone_idx").on(table.phone),
    index("customers_last_seen_at_idx").on(table.lastSeenAt),
  ],
);

export const orders = pgTable(
  "orders",
  {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  itemsJson: text("items_json").notNull(),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").notNull().default(0),
  total: real("total").notNull().default(0),
  fulfillment: varchar("fulfillment", { length: 20 }).notNull(),
  deliveryZone: varchar("delivery_zone", { length: 100 }).notNull().default(""),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("cash"),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("pending"),
  paymentReference: varchar("payment_reference", { length: 200 }).notNull().default(""),
  providerOrderId: varchar("provider_order_id", { length: 100 }).notNull().default(""),
  providerTransactionId: varchar("provider_transaction_id", { length: 100 }).notNull().default(""),
  orderStatus: varchar("order_status", { length: 30 }).notNull().default("new"),
  address: text("address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  language: varchar("language", { length: 5 }).notNull().default("ar"),
  promoCode: varchar("promo_code", { length: 20 }).notNull().default(""),
  discountAmount: real("discount_amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
},
(table) => [
  index("orders_created_at_idx").on(table.createdAt),
  index("orders_customer_id_idx").on(table.customerId),
  index("orders_order_status_idx").on(table.orderStatus),
],
);

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productOverrides = pgTable("product_overrides", {
  id: varchar("id", { length: 80 }).primaryKey(),
  dataJson: text("data_json").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 200 }).notNull(),
    name: varchar("name", { length: 90 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("order_receiver"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("admin_users_email_idx").on(table.email),
    index("admin_users_created_at_idx").on(table.createdAt),
  ],
);

export const journeyCities = pgTable(
  "journey_cities",
  {
    id: serial("id").primaryKey(),
    nameAr: varchar("name_ar", { length: 100 }).notNull(),
    nameEn: varchar("name_en", { length: 100 }).notNull(),
    descAr: varchar("desc_ar", { length: 300 }).notNull().default(""),
    descEn: varchar("desc_en", { length: 300 }).notNull().default(""),
    productAr: varchar("product_ar", { length: 100 }).notNull().default(""),
    productEn: varchar("product_en", { length: 100 }).notNull().default(""),
    imageUrl: varchar("image_url", { length: 300 }).notNull().default(""),
    linkTo: varchar("link_to", { length: 200 }).notNull().default("/menu"),
    x: real("x").notNull().default(50),
    y: real("y").notNull().default(50),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("journey_cities_sort_order_idx").on(table.sortOrder),
  ],
);

export const loyaltyLedger = pgTable(
  "loyalty_ledger",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    orderId: integer("order_id"),
    reason: varchar("reason", { length: 40 }).notNull(),
    points: integer("points").notNull(),
    balance: integer("balance").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("earned"),
    note: varchar("note", { length: 200 }).notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("loyalty_ledger_customer_id_idx").on(table.customerId),
    index("loyalty_ledger_created_at_idx").on(table.createdAt),
  ],
);

export const siteEvents = pgTable(
  "site_events",
  {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull().default(""),
    event: varchar("event", { length: 60 }).notNull(),
    page: varchar("page", { length: 200 }).notNull().default(""),
    metaJson: text("meta_json").notNull().default("{}"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("site_events_event_idx").on(table.event),
    index("site_events_created_at_idx").on(table.createdAt),
    index("site_events_session_id_idx").on(table.sessionId),
  ],
);
