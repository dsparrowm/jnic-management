import { OnboardPasswordForm } from "@/components/onboarding/onboard-password-form";

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OnboardPasswordForm token={token} />;
}
