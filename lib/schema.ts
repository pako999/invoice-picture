import {
  integer, pgEnum, pgTable, serial, text, timestamp, varchar,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("invoice_status", ["pending", "sent", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userSettings = pgTable("userSettings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
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

export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
