const LOCAL_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
] as const;

function parseOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [...LOCAL_DEV_ORIGINS];
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function uniqueOrigins(origins: string[]): string[] {
  return [...new Set(origins)];
}

/** CORS allowlist — comma-separated WEB_ORIGIN or localhost defaults. */
export function getCorsOrigins(): string | string[] {
  if (process.env.NODE_ENV === "production") {
    const raw = process.env.WEB_ORIGIN?.trim();
    if (!raw) {
      throw new Error("WEB_ORIGIN is required in production.");
    }
    const productionOrigins = parseOrigins(raw);
    if (productionOrigins.length === 0) {
      throw new Error("WEB_ORIGIN is required in production.");
    }
    const origins = uniqueOrigins([...productionOrigins, ...LOCAL_DEV_ORIGINS]);
    return origins.length === 1 ? origins[0]! : origins;
  }

  const origins = uniqueOrigins([...parseOrigins(process.env.WEB_ORIGIN), ...LOCAL_DEV_ORIGINS]);
  return origins.length === 1 ? origins[0]! : origins;
}

/** Public web app URL for links in emails (onboarding, etc.). */
export function getWebAppUrl(): string {
  const explicit = process.env.WEB_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "WEB_APP_URL is required in production so onboarding emails contain a valid invitation link.",
    );
  }

  return getPrimaryWebOrigin();
}

/** Base URL for onboarding links — first origin in WEB_ORIGIN. */
export function getPrimaryWebOrigin(): string {
  const origins = parseOrigins(process.env.WEB_ORIGIN);
  return origins[0] ?? LOCAL_DEV_ORIGINS[0];
}
