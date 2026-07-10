"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const session = await api.login(email, password);
      saveSession(session);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Sign in" subtitle="Jubilee Nation Leadership & Operations Platform">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
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
          {loading ? "Signing in…" : "Sign in"}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
