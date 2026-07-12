import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { createElement } from "react";
import { SendEmailOptions } from "./email.types";
import { OnboardingEmailTemplate } from "./templates";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resendClient: Resend | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>("RESEND_API_KEY"));
  }

  private getResendClient(): Resend {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException("Email service is not configured");
    }

    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }

    return this.resendClient;
  }

  private getFromAddress(): string {
    return (
      this.config.get<string>("EMAIL_FROM") ??
      `${this.config.get<string>("FROM_NAME", "JNLOP")} <${this.config.get<string>("FROM_EMAIL", "onboarding@jnic.org")}>`
    );
  }

  private getSupportEmail(): string {
    return this.config.get<string>("EMAIL_SUPPORT", "support@jnic.org");
  }

  /** Generic Resend send — mirrors nexgen email.service pattern */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isConfigured()) {
      const message = `Email not sent (RESEND_API_KEY missing): ${options.subject} -> ${options.to}`;
      if (process.env.NODE_ENV === "development") {
        this.logger.warn(message);
        return;
      }
      throw new InternalServerErrorException("Email service is not configured");
    }

    const from = options.from ?? this.getFromAddress();
    const supportEmail = this.getSupportEmail();

    try {
      const resend = this.getResendClient();
      const { data, error } = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        headers: {
          "X-Entity-Ref-ID": Date.now().toString(),
          "List-Unsubscribe": `<mailto:${supportEmail}?subject=unsubscribe>`,
          ...options.headers,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Email sent to ${options.to} (${options.subject})${data?.id ? ` [${data.id}]` : ""}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      this.logger.error(`Failed to send email to ${options.to}: ${message}`);
      throw new InternalServerErrorException(`Failed to send email: ${message}`);
    }
  }

  async sendOnboardingEmail(to: string, name: string, link: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(`RESEND_API_KEY not set — onboarding link for ${to}: ${link}`);
      return;
    }

    const html = await render(
      createElement(OnboardingEmailTemplate, {
        name,
        link,
        expiresHours: 48,
        supportEmail: this.getSupportEmail(),
      }),
    );

    await this.sendEmail({
      to,
      subject: "Welcome to JNLOP — set your password",
      html,
    });
  }
}
