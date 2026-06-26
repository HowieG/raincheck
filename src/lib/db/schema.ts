import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "active",
  "cancelled",
  "elapsed",
]);

export const notifyKindEnum = pgEnum("notify_kind", ["invite", "cancel"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    isAdmin: boolean("is_admin").notNull().default(false),
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_phone_idx").on(t.phone),
    check("users_phone_e164_chk", sql`${t.phone} ~ '^\\+[1-9][0-9]{1,14}$'`),
  ]
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    restaurant: text("restaurant").notNull(),
    location: text("location"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    sourceUrl: text("source_url"),
    googlePlaceId: text("google_place_id"),
    status: reservationStatusEnum("status").notNull().default("active"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reservations_creator_idx").on(t.creatorId),
    index("reservations_status_scheduled_idx").on(t.status, t.scheduledAt),
  ]
);

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    voteCancel: boolean("vote_cancel").notNull().default(false),
    votedAt: timestamp("voted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("attendees_res_user_idx").on(t.reservationId, t.userId),
    index("attendees_user_idx").on(t.userId),
  ]
);

export const failedNotifications = pgTable("failed_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id").references(() => reservations.id, {
    onDelete: "set null",
  }),
  recipientUserId: uuid("recipient_user_id").references(() => users.id),
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  channel: text("channel").notNull(),
  body: text("body").notNull(),
  kind: notifyKindEnum("kind").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;
