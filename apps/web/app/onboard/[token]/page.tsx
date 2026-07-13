import { OnboardPasswordForm } from "@/components/onboarding/onboard-password-form";

function sanitizeTokenFromPath(token: string): string {
  try {
    return decodeURIComponent(token).trim();
  } catch {
    return token.trim();
  }
}

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OnboardPasswordForm token={sanitizeTokenFromPath(token)} />;
}
