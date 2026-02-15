type QueryParamValue = string | string[] | null | undefined;

export function getQueryParam(value: QueryParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function sanitizeRedirectPath(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  const trimmed = path.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");

    if (parsed.origin !== "http://localhost") {
      return null;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function resolveRedirectPath(
  value: QueryParamValue,
  fallback = "/saved"
): string {
  return sanitizeRedirectPath(getQueryParam(value)) ?? fallback;
}

export function withNextParam(path: string, nextPath: string | null): string {
  if (!nextPath) {
    return path;
  }

  const params = new URLSearchParams({ next: nextPath });

  return `${path}?${params.toString()}`;
}
