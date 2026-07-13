/** Normalize onboarding token from URL params, email links, or request bodies. */
export function sanitizeOnboardingToken(token: string): string {
  try {
    return decodeURIComponent(token).trim();
  } catch {
    return token.trim();
  }
}
