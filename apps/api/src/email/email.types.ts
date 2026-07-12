export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  headers?: Record<string, string>;
}
