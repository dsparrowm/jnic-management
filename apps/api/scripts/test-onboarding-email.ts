/**
 * Test onboarding email delivery via Resend.
 *
 * Usage (from repo root):
 *   pnpm --filter @repo/api test:email
 *
 * With recipient:
 *   TEST_EMAIL="pastor@example.com" pnpm --filter @repo/api test:email
 */

import { config } from "dotenv";
import { resolve } from "path";
import { EmailService } from "../src/email/email.service";
import { ConfigService } from "@nestjs/config";
import { getWebAppUrl } from "../src/common/web-origin";

config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env") });

async function main() {
  const testEmail = process.env.TEST_EMAIL ?? process.argv.find((arg) => arg.includes("@"));

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Add it to .env or apps/api/.env");
    process.exit(1);
  }

  if (!testEmail) {
    console.error("Provide TEST_EMAIL or pass an email as a CLI argument.");
    process.exit(1);
  }

  const configService = new ConfigService(process.env);
  const emailService = new EmailService(configService);
  const webOrigin = getWebAppUrl();
  const link = `${webOrigin}/onboard/test-token-preview`;

  console.log(`Sending onboarding test email to ${testEmail}...`);
  console.log(`From: ${configService.get("EMAIL_FROM") ?? "(default)"}`);
  console.log(`Link preview: ${link}\n`);

  await emailService.sendOnboardingEmail(testEmail, "Test Pastor", link);

  console.log("Onboarding email sent successfully.");
}

main().catch((error) => {
  console.error("Email test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
