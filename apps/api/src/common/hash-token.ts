import { createHash } from "crypto";

/** SHA-256 hex digest for opaque tokens stored at rest (refresh, onboarding). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
