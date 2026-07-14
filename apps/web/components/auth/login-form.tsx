"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/auth/auth-card";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const inputClassName =
  "h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="flex min-h-screen">
      <section className="sidebar-gradient relative hidden min-h-screen overflow-hidden p-12 text-white lg:block lg:w-1/2">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary blur-3xl" />
        </div>

        <Image
          src="/images/jnic-logo-transparent.png"
          alt="JNIC"
          width={200}
          height={64}
          priority
          className="absolute left-12 top-12 z-10 h-16 w-auto object-contain"
        />

        <div className="absolute inset-0 flex items-center justify-center px-12">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Jubilee Nation
              <br />
              <span className="text-primary">Leadership Platform</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--text-sidebar-muted)]">
              Internal management platform for Jubilee Nation International Churches — unifying
              pastoral operations, reporting, and ministry oversight across Nigeria.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-[var(--bg-base)] px-5 py-10">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/images/jnic-logo-transparent.png"
              alt="JNIC"
              width={180}
              height={56}
              priority
              className="h-14 w-auto object-contain"
            />
            <h1 className="mt-3 font-display text-2xl font-bold">Welcome to JNLOP</h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-lg-token)] sm:p-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">Access your leadership workspace.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="login-email" className="text-sm font-medium">
                  Email address
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                    placeholder="you@jnic.org"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputClassName, "pr-12")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <ErrorText message={error} />

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[var(--bg-sidebar)] text-sm font-semibold text-white hover:bg-[var(--bg-sidebar-surface)]"
              >
                {loading ? "Signing in…" : "Sign In"}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
