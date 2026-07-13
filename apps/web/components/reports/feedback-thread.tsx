"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { ErrorText } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiError, FeedbackRecord } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

interface FeedbackThreadProps {
  reportId: string;
  canLeaveFeedback: boolean;
}

export function FeedbackThread({ reportId, canLeaveFeedback }: FeedbackThreadProps) {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const loadFeedback = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(undefined);
    try {
      const response = await api.listReportFeedback(token, reportId);
      setItems(response.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load feedback");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !message.trim()) return;

    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const created = await api.createReportFeedback(token, reportId, message.trim());
      setItems((current) => [...current, created]);
      setMessage("");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading feedback…</p>
      )}

      {error && <ErrorText message={error} />}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No feedback yet. Comments are informational and do not block report review.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{item.fromUser.name}</p>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {formatTimestamp(item.createdAt)}
                </time>
              </div>
              <p className="mt-2 text-sm text-foreground">{item.message}</p>
            </li>
          ))}
        </ul>
      )}

      {canLeaveFeedback && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`feedback-${reportId}`}>Leave feedback</Label>
            <textarea
              id={`feedback-${reportId}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Share guidance or observations for the submitter…"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Feedback is visible to the report submitter and does not block status progression.
          </p>
          <ErrorText message={submitError} />
          <Button type="submit" size="sm" disabled={submitting || !message.trim()}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send feedback"
            )}
          </Button>
        </form>
      )}
    </section>
  );
}
