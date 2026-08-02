CREATE TABLE "journey_cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"desc_ar" varchar(300) DEFAULT '' NOT NULL,
	"desc_en" varchar(300) DEFAULT '' NOT NULL,
	"product_ar" varchar(100) DEFAULT '' NOT NULL,
	"product_en" varchar(100) DEFAULT '' NOT NULL,
	"image_url" varchar(300) DEFAULT '' NOT NULL,
	"link_to" varchar(200) DEFAULT '/menu' NOT NULL,
	"x" real DEFAULT 50 NOT NULL,
	"y" real DEFAULT 50 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"order_id" integer,
	"reason" varchar(40) NOT NULL,
	"points" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'earned' NOT NULL,
	"note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "journey_cities_sort_order_idx" ON "journey_cities" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "loyalty_ledger_customer_id_idx" ON "loyalty_ledger" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX "loyalty_ledger_created_at_idx" ON "loyalty_ledger" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
