"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { computeWeekOf, formatWeekEndingLabel } from "@repo/types";
import { useEffect, useMemo, useState } from "react";
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
  branchName?: string | null;
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
  money = false,
}: {
  id: keyof WeeklyReportFormValues;
  label: string;
  register: ReturnType<typeof useForm<WeeklyReportFormValues>>["register"];
  disabled?: boolean;
  money?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={money ? "0.01" : "1"}
        disabled={disabled}
        className="font-mono"
        {...register(id)}
      />
    </div>
  );
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function WeeklyReportForm({
  existingReport,
  defaultServiceDate,
  branchName,
  loading,
  error,
  onSubmit,
}: WeeklyReportFormProps) {
  const locked = existingReport ? !existingReport.editable : false;
  const [noService, setNoService] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [blockError, setBlockError] = useState<string>();

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
    setValue,
    formState: { errors },
  } = useForm<WeeklyReportFormValues>({
    resolver: zodResolver(weeklyReportSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
    setNoService(false);
    setConfirming(false);
    setBlockError(undefined);
  }, [defaultValues, reset]);

  const serviceDate = watch("serviceDate");
  const adultCount = Number(watch("adultCount") || 0);
  const teenageCount = Number(watch("teenageCount") || 0);
  const childrenCount = Number(watch("childrenCount") || 0);
  const tithe = Number(watch("tithe") || 0);
  const offering = Number(watch("offering") || 0);
  const other = Number(watch("other") || 0);
  const attendanceTotal = adultCount + teenageCount + childrenCount;
  const financeTotal = tithe + offering + other;
  const weekEnding = serviceDate ? formatWeekEndingLabel(computeWeekOf(serviceDate)) : "";

  async function submitValues(values: WeeklyReportFormValues) {
    setBlockError(undefined);
    const payload = noService
      ? {
          ...values,
          adultCount: 0,
          teenageCount: 0,
          childrenCount: 0,
          tithe: 0,
          offering: 0,
          other: 0,
          currency: "NGN",
        }
      : values;
    const allZero =
      payload.adultCount +
        payload.teenageCount +
        payload.childrenCount +
        payload.tithe +
        payload.offering +
        payload.other ===
      0;
    if (!noService && allZero) {
      setBlockError("If the branch did not meet this week, mark No service before sending.");
      setConfirming(false);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await onSubmit(payload);
    setConfirming(false);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => void handleSubmit(submitValues)(event)}
    >
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        {branchName ? (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{branchName}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Week ending{" "}
          <span className="font-medium text-foreground">{weekEnding || "—"}</span>
        </p>
        {existingReport && locked && (
          <p className="mt-2 text-sm text-amber-700">
            This report is locked after your zone forwarded it and can no longer be edited.
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
        {!locked && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={noService}
              disabled={loading}
              onChange={(event) => {
                const checked = event.target.checked;
                setNoService(checked);
                setConfirming(false);
                if (checked) {
                  setValue("adultCount", 0);
                  setValue("teenageCount", 0);
                  setValue("childrenCount", 0);
                  setValue("tithe", 0);
                  setValue("offering", 0);
                  setValue("other", 0);
                }
              }}
            />
            <span>
              <span className="font-medium text-foreground">No service this week</span>
              <span className="mt-0.5 block text-muted-foreground">
                Sends zeros if the branch did not meet.
              </span>
            </span>
          </label>
        )}
      </FormSection>

      <FormSection title="Attendance" description="Headcounts from the main service.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField id="adultCount" label="Adults" register={register} disabled={locked || loading || noService} />
          <NumberField id="teenageCount" label="Teenagers" register={register} disabled={locked || loading || noService} />
          <NumberField id="childrenCount" label="Children" register={register} disabled={locked || loading || noService} />
        </div>
      </FormSection>

      <FormSection title="Finance" description="Offering and tithe totals for the service week.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField id="tithe" label="Tithe (₦)" register={register} disabled={locked || loading || noService} money />
          <NumberField id="offering" label="Offering (₦)" register={register} disabled={locked || loading || noService} money />
          <NumberField id="other" label="Other (₦)" register={register} disabled={locked || loading || noService} money />
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" disabled readOnly {...register("currency")} />
          </div>
        </div>
      </FormSection>

      <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Attendance</p>
          <p className="mt-1 text-lg font-semibold">{attendanceTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-1 text-lg font-semibold">{formatNaira(financeTotal)}</p>
        </div>
      </div>

      {confirming && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {noService
            ? "No service will be recorded for this week. Confirm to send zeros."
            : `Sending ${attendanceTotal.toLocaleString()} people and ${formatNaira(financeTotal)} for the week ending ${weekEnding}.`}
        </div>
      )}

      {(blockError || error) && <ErrorText message={blockError ?? error} />}

      {!locked && (
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          {confirming && (
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Go back
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving…"
              : confirming
                ? existingReport
                  ? "Confirm update"
                  : "Send report"
                : existingReport
                  ? "Review update"
                  : "Review report"}
          </Button>
        </div>
      )}
    </form>
  );
}
