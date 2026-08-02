CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" varchar(200) NOT NULL,
	"name" varchar(90) NOT NULL,
	"role" varchar(20) DEFAULT 'order_receiver' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_users_email_idx" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(90) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(160) DEFAULT '' NOT NULL,
	"area" varchar(100) DEFAULT '' NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"total_spent" real DEFAULT 0 NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone"),
	CONSTRAINT "customers_phone_idx" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"items_json" text NOT NULL,
	"subtotal" real NOT NULL,
	"delivery_fee" real DEFAULT 0 NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"fulfillment" varchar(20) NOT NULL,
	"delivery_zone" varchar(100) DEFAULT '' NOT NULL,
	"payment_method" varchar(20) DEFAULT 'cash' NOT NULL,
	"payment_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"payment_reference" varchar(200) DEFAULT '' NOT NULL,
	"provider_order_id" varchar(100) DEFAULT '' NOT NULL,
	"provider_transaction_id" varchar(100) DEFAULT '' NOT NULL,
	"order_status" varchar(30) DEFAULT 'new' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"language" varchar(5) DEFAULT 'ar' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_overrides" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"data_json" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_users_created_at_idx" ON "admin_users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customers_last_seen_at_idx" ON "customers" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_order_status_idx" ON "orders" USING btree ("order_status");