import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";

export interface FeedbackEmailTemplateProps {
  recipientName: string;
  senderName: string;
  branchName: string;
  weekOf: string;
  messagePreview: string;
  reportUrl: string;
  supportEmail?: string;
}

export function FeedbackEmailTemplate({
  recipientName,
  senderName,
  branchName,
  weekOf,
  messagePreview,
  reportUrl,
  supportEmail = "support@jnic.org",
}: FeedbackEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandEyebrow}>Jubilee Nation International Churches</Text>
            <Heading style={brandTitle}>JNLOP</Heading>
          </Section>

          <Section style={card}>
            <Heading style={h1}>New feedback on your report</Heading>
            <Text style={text}>Hi {recipientName},</Text>
            <Text style={text}>
              <strong>{senderName}</strong> left feedback on your weekly report for{" "}
              <strong>{branchName}</strong> (week ending {weekOf}).
            </Text>
            <Section style={quote}>
              <Text style={quoteText}>{messagePreview}</Text>
            </Section>
            <Link href={reportUrl} style={button}>
              View report
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Questions? Contact{" "}
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const header = {
  backgroundColor: "#0a1628",
  borderRadius: "8px 8px 0 0",
  padding: "24px",
  textAlign: "center" as const,
};
const brandEyebrow = { color: "#c9a227", fontSize: "11px", margin: "0 0 4px", letterSpacing: "0.08em" };
const brandTitle = { color: "#ffffff", fontSize: "22px", margin: "0" };
const card = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "28px 24px",
};
const h1 = { color: "#0a1628", fontSize: "20px", margin: "0 0 16px" };
const text = { color: "#3f3f46", fontSize: "15px", lineHeight: "24px" };
const quote = {
  backgroundColor: "#f4f4f5",
  borderLeft: "4px solid #c9a227",
  padding: "12px 16px",
  margin: "16px 0",
};
const quoteText = { color: "#3f3f46", fontSize: "14px", lineHeight: "22px", margin: "0" };
const button = {
  backgroundColor: "#0a1628",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "bold" as const,
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = { color: "#71717a", fontSize: "12px", textAlign: "center" as const };
const link = { color: "#0a1628" };
