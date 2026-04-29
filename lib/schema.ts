import {
  integer, pgEnum, pgTable, serial, text, timestamp, varchar,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("invoice_status", ["pending", "sent", "failed"]);

// No users table — Clerk manages users
// We only store settings and invoices per Clerk userId (string)

export const userSettings = pgTable("userSettings", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull().unique(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull().default("Račun"),
  imageData: text("imageData"),
  imageMime: varchar("imageMime", { length: 32 }).default("image/jpeg"),
  filename: varchar("filename", { length: 255 }).notNull(),
  status: statusEnum("status").default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
