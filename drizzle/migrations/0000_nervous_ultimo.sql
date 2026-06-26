CREATE TYPE "public"."notify_kind" AS ENUM('invite', 'cancel');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'cancelled', 'elapsed');--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_cancel" boolean DEFAULT false NOT NULL,
	"voted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failed_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid,
	"recipient_user_id" uuid,
	"recipient_phone" text,
	"recipient_email" text,
	"channel" text NOT NULL,
	"body" text NOT NULL,
	"kind" "notify_kind" NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"restaurant" text NOT NULL,
	"location" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"source_url" text,
	"google_place_id" text,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_e164_chk" CHECK ("users"."phone" ~ '^\+[1-9][0-9]{1,14}$')
);
--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failed_notifications" ADD CONSTRAINT "failed_notifications_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failed_notifications" ADD CONSTRAINT "failed_notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendees_res_user_idx" ON "attendees" USING btree ("reservation_id","user_id");--> statement-breakpoint
CREATE INDEX "attendees_user_idx" ON "attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reservations_creator_idx" ON "reservations" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "reservations_status_scheduled_idx" ON "reservations" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");