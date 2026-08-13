import { Logger } from "@nestjs/common";
import { getWebAppUrl } from "./web-origin";

const logger = new Logger("ProductionConfig");
const MIN_SECRET_LENGTH = 32;

function isWeakSecret(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    value.length < MIN_SECRET_LENGTH ||
    lower.includes("change-me") ||
    lower.includes("changeme")
  );
}

function assertHttpsPublicUrl(value: string, name: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use https in production.`);
  }

  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    throw new Error(`${name} must not use localhost in production.`);
  }
}

export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const errors: string[] = [];

  const accessSecret = process.env.JWT_ACCESS_SECRET?.trim() ?? "";
  if (!accessSecret) {
    errors.push("JWT_ACCESS_SECRET is required.");
  } else if (isWeakSecret(accessSecret)) {
    errors.push(
      `JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters and must not be a placeholder.`,
    );
  }

  const webOrigin = process.env.WEB_ORIGIN?.trim();
  if (!webOrigin) {
    errors.push("WEB_ORIGIN is required.");
  } else {
    for (const origin of webOrigin.split(",").map((item) => item.trim()).filter(Boolean)) {
      try {
        assertHttpsPublicUrl(origin, "WEB_ORIGIN");
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Invalid WEB_ORIGIN.");
      }
    }
  }

  const webAppUrl = process.env.WEB_APP_URL?.trim();
  if (!webAppUrl) {
    errors.push("WEB_APP_URL is required.");
  } else {
    try {
      assertHttpsPublicUrl(webAppUrl, "WEB_APP_URL");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Invalid WEB_APP_URL.");
    }
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    errors.push("RESEND_API_KEY is required.");
  }

  if (errors.length > 0) {
    for (const message of errors) {
      logger.error(message);
    }
    throw new Error(`Invalid production configuration:\n- ${errors.join("\n- ")}`);
  }

  logger.log(`Onboarding links will use WEB_APP_URL: ${getWebAppUrl()}`);
}
