import { Logger } from "@nestjs/common";
import { getWebAppUrl } from "./web-origin";

const logger = new Logger("ProductionConfig");

export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const webAppUrl = process.env.WEB_APP_URL?.trim();
  if (!webAppUrl) {
    logger.error(
      "WEB_APP_URL is not set. Onboarding emails will point to localhost and invitation links will fail.",
    );
    return;
  }

  if (webAppUrl.includes("localhost")) {
    logger.error("WEB_APP_URL must not use localhost in production.");
  }

  const webOrigin = process.env.WEB_ORIGIN?.trim();
  if (!webOrigin) {
    logger.warn(
      "WEB_ORIGIN is not set. Browser requests from your deployed web app may be blocked by CORS.",
    );
  }

  try {
    const resolved = getWebAppUrl();
    logger.log(`Onboarding links will use WEB_APP_URL: ${resolved}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid WEB_APP_URL";
    logger.error(message);
  }
}
