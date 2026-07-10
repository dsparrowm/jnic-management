"use client";

import { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-xl border p-8"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>
          JNLOP
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
        <div className={children ? "mt-6" : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2";

export const inputStyle = {
  borderColor: "var(--border-default)",
  background: "var(--bg-base)",
};

export function PrimaryButton({
  children,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      style={{ background: "var(--accent-primary)", color: "var(--accent-foreground)" }}
    >
      {children}
    </button>
  );
}

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm" style={{ color: "var(--state-error)" }}>
      {message}
    </p>
  );
}
