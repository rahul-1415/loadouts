export type PasswordStrengthLabel = "weak" | "medium" | "strong";

export interface PasswordStrengthResult {
  score: number;
  label: PasswordStrengthLabel;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: "weak" };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 5) {
    return { score, label: "strong" };
  }

  if (score >= 3) {
    return { score, label: "medium" };
  }

  return { score, label: "weak" };
}
