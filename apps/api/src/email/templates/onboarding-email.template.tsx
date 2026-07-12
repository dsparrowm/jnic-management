import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

export interface OnboardingEmailTemplateProps {
  name: string;
  link: string;
  expiresHours?: number;
  supportEmail?: string;
}

/** JNIC-branded onboarding invite — navy + gold tokens from context/ui-context.md */
export function OnboardingEmailTemplate({
  name,
  link,
  expiresHours = 48,
  supportEmail = "support@jnic.org",
}: OnboardingEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandEyebrow}>Jubilee Nation International Churches</Text>
            <Heading style={brandTitle}>JNLOP</Heading>
            <Text style={brandSubtitle}>Leadership & Operations Platform</Text>
          </Section>

          <Section style={card}>
            <Heading style={h1}>You&apos;re invited</Heading>

            <Text style={text}>Hello {name},</Text>

            <Text style={text}>
              An administrator has created your pastor account on the Jubilee Nation Leadership &
              Operations Platform. Use the button below to set your password and activate your
              account.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={link}>
                Set your password
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                This link expires in <strong>{expiresHours} hours</strong>. If it expires, ask your
                administrator to resend the invitation from the Pastors directory.
              </Text>
            </Section>

            <Text style={mutedText}>
              If the button does not work, copy and paste this URL into your browser:
            </Text>
            <Text style={linkText}>{link}</Text>

            <Section style={securityBox}>
              <Text style={securityText}>
                <strong>Security note:</strong> JNIC will never ask for your password by email. If
                you did not expect this invitation, you can safely ignore this message.
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              <strong>Jubilee Nation Leadership & Operations Platform</strong>
            </Text>
            <Text style={footerText}>This is an automated email — please do not reply.</Text>
            <Text style={footerText}>
              Need help? Contact{" "}
              <a href={`mailto:${supportEmail}`} style={footerLink}>
                {supportEmail}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#F4F6FB",
  fontFamily: "Inter, Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  lineHeight: "1.6",
  color: "#111827",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "24px 16px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const brandEyebrow = {
  margin: "0 0 8px",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#6B7280",
};

const brandTitle = {
  margin: "0",
  fontSize: "28px",
  fontWeight: "700",
  color: "#0D1B3E",
  letterSpacing: "0.04em",
};

const brandSubtitle = {
  margin: "8px 0 0",
  fontSize: "14px",
  color: "#6B7280",
};

const card = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "32px 28px",
  boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08)",
};

const h1 = {
  margin: "0 0 20px",
  fontSize: "22px",
  fontWeight: "600",
  color: "#0D1B3E",
};

const text = {
  margin: "0 0 16px",
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#111827",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#C9A050",
  color: "#FFFFFF",
  padding: "14px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "15px",
  display: "inline-block",
};

const infoBox = {
  backgroundColor: "#FFFBEB",
  borderLeft: "4px solid #C9A050",
  padding: "14px 16px",
  borderRadius: "6px",
  margin: "0 0 20px",
};

const infoText = {
  margin: "0",
  fontSize: "14px",
  color: "#92400E",
  lineHeight: "1.5",
};

const mutedText = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#6B7280",
};

const linkText = {
  margin: "0 0 20px",
  fontSize: "12px",
  color: "#2563EB",
  wordBreak: "break-all" as const,
};

const securityBox = {
  backgroundColor: "#F3F4F6",
  padding: "14px 16px",
  borderRadius: "8px",
};

const securityText = {
  margin: "0",
  fontSize: "13px",
  color: "#4B5563",
  lineHeight: "1.5",
};

const hr = {
  border: "none",
  borderTop: "1px solid #E5E7EB",
  margin: "24px 0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  margin: "4px 0",
  fontSize: "12px",
  color: "#6B7280",
};

const footerLink = {
  color: "#C9A050",
  textDecoration: "none",
};
