import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendOnboardingEmail(to: string, name: string, link: string): Promise<void> {
    const from = this.config.get<string>("EMAIL_FROM", "JNLOP <onboarding@jnic.org>");
    const subject = "Welcome to JNLOP — set your password";
    const html = `
      <p>Hello ${name},</p>
      <p>You have been invited to Jubilee Nation Leadership & Operations Platform.</p>
      <p><a href="${link}">Click here to set your password</a> (link expires in 48 hours).</p>
      <p>If you did not expect this email, you can ignore it.</p>
    `;

    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not set — onboarding link for ${to}: ${link}`);
      return;
    }

    await this.resend.emails.send({ from, to, subject, html });
  }
}
