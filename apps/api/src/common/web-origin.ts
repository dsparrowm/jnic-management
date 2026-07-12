const LOCAL_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
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

/** CORS allowlist — comma-separated WEB_ORIGIN or localhost:3000–3002 by default. */
export function getCorsOrigins(): string | string[] {
  const origins = parseOrigins(process.env.WEB_ORIGIN);
  return origins.length === 1 ? origins[0]! : origins;
}

/** Public web app URL for links in emails (onboarding, etc.). */
export function getWebAppUrl(): string {
  const explicit = process.env.WEB_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return getPrimaryWebOrigin();
}

/** Base URL for onboarding links — first origin in WEB_ORIGIN. */
export function getPrimaryWebOrigin(): string {
  const origins = parseOrigins(process.env.WEB_ORIGIN);
  return origins[0] ?? LOCAL_DEV_ORIGINS[0];
}
