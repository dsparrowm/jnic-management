"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { computeWeekOf, formatWeekEndingLabel } from "@repo/types";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorText } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeeklyReportRecord } from "@/lib/api";

const weeklyReportSchema = z.object({
  serviceDate: z.string().min(1, "Service date is required"),
  adultCount: z.coerce.number().int().min(0),
  teenageCount: z.coerce.number().int().min(0),
  childrenCount: z.coerce.number().int().min(0),
  tithe: z.coerce.number().min(0),
  offering: z.coerce.number().min(0),
  other: z.coerce.number().min(0),
  currency: z.string().length(3),
});

export type WeeklyReportFormValues = z.infer<typeof weeklyReportSchema>;

interface WeeklyReportFormProps {
  existingReport?: WeeklyReportRecord | null;
  defaultServiceDate: string;
  loading?: boolean;
  error?: string;
  onSubmit: (values: WeeklyReportFormValues) => Promise<void>;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function NumberField({
  id,
  label,
  register,
  disabled,
}: {
  id: keyof WeeklyReportFormValues;
  label: string;
  register: ReturnType<typeof useForm<WeeklyReportFormValues>>["register"];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={id === "tithe" || id === "offering" || id === "other" ? "0.01" : "1"}
        disabled={disabled}
        className="font-mono"
        {...register(id)}
      />
    </div>
  );
}

export function WeeklyReportForm({
  existingReport,
  defaultServiceDate,
  loading,
  error,
  onSubmit,
}: WeeklyReportFormProps) {
  const locked = existingReport ? !existingReport.editable : false;

  const defaultValues = useMemo<WeeklyReportFormValues>(
    () => ({
      serviceDate: existingReport?.serviceDate ?? defaultServiceDate,
      adultCount: existingReport?.attendance?.adultCount ?? 0,
      teenageCount: existingReport?.attendance?.teenageCount ?? 0,
      childrenCount: existingReport?.attendance?.childrenCount ?? 0,
      tithe: existingReport?.finance?.tithe ?? 0,
      offering: existingReport?.finance?.offering ?? 0,
      other: existingReport?.finance?.other ?? 0,
      currency: existingReport?.finance?.currency ?? "NGN",
    }),
    [defaultServiceDate, existingReport],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<WeeklyReportFormValues>({
    resolver: zodResolver(weeklyReportSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const serviceDate = watch("serviceDate");
  const weekEnding = serviceDate ? formatWeekEndingLabel(computeWeekOf(serviceDate)) : "";

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Week ending{" "}
          <span className="font-medium text-foreground">{weekEnding || "—"}</span>
        </p>
        {existingReport && locked && (
          <p className="mt-2 text-sm text-amber-700">
            This report is locked after zone review and can no longer be edited.
          </p>
        )}
      </div>

      <FormSection title="Service" description="The date your branch held its main service.">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="serviceDate">Service date</Label>
          <Input id="serviceDate" type="date" disabled={locked || loading} {...register("serviceDate")} />
          {errors.serviceDate && (
            <p className="text-sm text-destructive">{errors.serviceDate.message}</p>
          )}
        </div>
      </FormSection>

      <FormSection title="Attendance" description="Headcounts from the main service.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField id="adultCount" label="Adults" register={register} disabled={locked || loading} />
          <NumberField id="teenageCount" label="Teenagers" register={register} disabled={locked || loading} />
          <NumberField id="childrenCount" label="Children" register={register} disabled={locked || loading} />
        </div>
      </FormSection>

      <FormSection title="Finance" description="Offering and tithe totals for the service week.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField id="tithe" label="Tithe" register={register} disabled={locked || loading} />
          <NumberField id="offering" label="Offering" register={register} disabled={locked || loading} />
          <NumberField id="other" label="Other" register={register} disabled={locked || loading} />
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" disabled readOnly {...register("currency")} />
          </div>
        </div>
      </FormSection>

      {error && <ErrorText message={error} />}

      {!locked && (
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving…"
              : existingReport
                ? "Update report"
                : "Submit report"}
          </Button>
        </div>
      )}
    </form>
  );
}
