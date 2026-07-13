"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { NotificationRecord, api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatNotificationTime(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.listNotifications(token);
      setItems(response.items);
      setUnreadCount(response.unreadCount);
    } catch {
      // Non-blocking — bell stays usable even if fetch fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open, loadNotifications]);

  async function handleOpenNotification(notification: NotificationRecord) {
    await handleMarkRead(notification);
    if (notification.metadata && typeof notification.metadata.reportId === "string") {
      router.push("/reports/submit");
      setOpen(false);
    }
  }

  async function handleMarkRead(notification: NotificationRecord) {
    const token = getAccessToken();
    if (!token || notification.readAt) return;

    try {
      await api.markNotificationRead(token, notification.id);
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // ignore
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex cursor-pointer flex-col items-start gap-1 py-3"
              onClick={() => void handleOpenNotification(item)}
            >
              <NotificationItem item={item} />
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ item }: { item: NotificationRecord }) {
  return (
    <>
      <div className="flex w-full items-start justify-between gap-2">
        <span className={`text-sm ${item.readAt ? "text-muted-foreground" : "font-medium text-foreground"}`}>
          {item.title}
        </span>
        {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
      </div>
      <span className="text-xs text-muted-foreground">{item.body}</span>
      <span className="text-[11px] text-muted-foreground">
        {formatNotificationTime(item.createdAt)}
      </span>
    </>
  );
}
