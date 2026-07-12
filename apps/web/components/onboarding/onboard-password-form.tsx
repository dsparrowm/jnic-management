"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthCard, ErrorText } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";

function formatExpiry(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OnboardPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    api
      .validateOnboarding(token)
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setExpiresAt(data.expiresAt);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Invalid or expired invitation link");
      })
      .finally(() => setValidating(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const session = await api.completeOnboarding(token, password);
      saveSession(session);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not complete onboarding");
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <AuthCard title="Checking your invitation" subtitle="Please wait while we validate your link.">
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthCard>
    );
  }

  if (error && !email) {
    return (
      <AuthCard
        title="Invitation unavailable"
        subtitle="This onboarding link is invalid or has expired. Ask your administrator to resend the invitation from the Pastors directory."
      >
        <p className="text-sm text-destructive">{error}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={`Welcome, ${name}`}
      subtitle="Create a password to activate your JNLOP pastor account."
    >
      <div className="mb-5 space-y-1 rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="text-muted-foreground">
          Account: <span className="font-medium text-foreground">{email}</span>
        </p>
        {expiresAt && (
          <p className="text-muted-foreground">
            Link expires: <span className="font-medium text-foreground">{formatExpiry(expiresAt)}</span>
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onboard-password">Password</Label>
          <Input
            id="onboard-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboard-confirm-password">Confirm password</Label>
          <Input
            id="onboard-confirm-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
          />
        </div>

        <ErrorText message={error} />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Activating account…
            </>
          ) : (
            "Set password & continue"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
