import { forbiddenResponse, requireCompleteUser, requireUser } from "./api";

const DEFAULT_ADMIN_EMAILS = ["rahulb1407@gmail.com"];

function getAdminEmails() {
  const configured = process.env.LOADOUTS_ADMIN_EMAILS
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth;
  }

  if (!isAdminEmail(auth.user.email)) {
    return { response: forbiddenResponse() };
  }

  return auth;
}

export async function requireAdminUser() {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth;
  }

  if (!isAdminEmail(auth.user.email)) {
    return { response: forbiddenResponse() };
  }

  return auth;
}
