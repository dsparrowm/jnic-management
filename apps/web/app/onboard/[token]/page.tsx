"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import {
  AuthCard,
  ErrorText,
  Field,
  inputClass,
  inputStyle,
  PrimaryButton,
} from "@/components/auth/auth-card";

export default function OnboardPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    api
      .validateOnboarding(token)
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Invalid link");
      })
      .finally(() => setValidating(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <AuthCard title="Checking link…" subtitle="Please wait while we validate your invitation." />
    );
  }

  if (error && !email) {
    return <AuthCard title="Invalid link" subtitle={error} />;
  }

  return (
    <AuthCard title={`Welcome, ${name}`} subtitle={`Set a password for ${email}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <ErrorText message={error} />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Activating…" : "Set password & continue"}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
