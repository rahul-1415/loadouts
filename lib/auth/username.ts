const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "categories",
  "collections",
  "explore",
  "followers",
  "following",
  "help",
  "home",
  "loadouts",
  "login",
  "me",
  "new",
  "onboarding",
  "profile",
  "profiles",
  "saved",
  "search",
  "settings",
  "signup",
  "support",
  "user",
  "users",
]);

export type UsernameValidationCode =
  | "REQUIRED"
  | "FORMAT"
  | "RESERVED";

export interface UsernameValidationResult {
  ok: boolean;
  normalizedUsername: string;
  code: UsernameValidationCode | null;
  message: string | null;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isReservedUsername(username: string) {
  return RESERVED_USERNAMES.has(username);
}

export function validateUsername(value: string): UsernameValidationResult {
  const normalizedUsername = normalizeUsername(value);

  if (!normalizedUsername) {
    return {
      ok: false,
      normalizedUsername,
      code: "REQUIRED",
      message: "Username is required.",
    };
  }

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return {
      ok: false,
      normalizedUsername,
      code: "FORMAT",
      message:
        "Use 3-30 lowercase letters, numbers, or underscores only.",
    };
  }

  if (isReservedUsername(normalizedUsername)) {
    return {
      ok: false,
      normalizedUsername,
      code: "RESERVED",
      message: "This username is reserved.",
    };
  }

  return {
    ok: true,
    normalizedUsername,
    code: null,
    message: null,
  };
}
