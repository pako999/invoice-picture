import { currentUser } from "@clerk/nextjs/server";

const DEFAULT_ADMIN_EMAILS = [
  "info@posljiracun.si",
  "info@surf-store.com",
  "mortmark44@gmail.com",
];

function adminEmails() {
  return new Set(
    [...DEFAULT_ADMIN_EMAILS, ...(process.env.ADMIN_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isCurrentUserAdmin() {
  const user = await currentUser();
  if (!user) return false;
  const allowed = adminEmails();
  return user.emailAddresses.some((item) => allowed.has(item.emailAddress.toLowerCase()));
}
