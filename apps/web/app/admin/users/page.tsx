"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/pastors");
  }, [router]);

  return null;
}
