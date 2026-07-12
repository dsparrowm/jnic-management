"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOnboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/pastors?onboard=1");
  }, [router]);

  return null;
}
