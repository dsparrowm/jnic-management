"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { ProfilePictureUpload } from "@/components/profile/profile-picture-upload";
import { api, ApiError, UserRecord } from "@/lib/api";
import { getAccessToken, getStoredUser, updateStoredUserProfilePic } from "@/lib/auth";
import { formatRole } from "@/lib/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [error, setError] = useState<string>();
  const sessionUser = getStoredUser();

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !sessionUser) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await api.getMe(token!);
        if (!cancelled) {
          setUser(profile);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Could not load profile");
          setReady(true);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router, sessionUser]);

  function handleProfileUpdated(updated: UserRecord) {
    setUser(updated);
    updateStoredUserProfilePic(updated.profilePicUrl);
  }

  if (!ready || !sessionUser) {
    return null;
  }

  return (
    <DashboardShell user={sessionUser} title="Profile">
      <div className="mx-auto max-w-3xl space-y-6">
        {error && <ErrorText message={error} />}

        {user && (
          <>
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Account</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Role</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatRole(user.role)}
                  </dd>
                </div>
                {user.phone && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Phone</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{user.phone}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Profile picture</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your photo appears on your profile and in the pastors directory.
              </p>
              <div className="mt-6">
                <ProfilePictureUpload user={user} onUpdated={handleProfileUpdated} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
