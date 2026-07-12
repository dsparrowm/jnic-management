"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  profilePicUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  name,
  profilePicUrl,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {profilePicUrl ? <AvatarImage src={profilePicUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          "bg-primary/10 text-sm font-semibold text-primary",
          fallbackClassName,
        )}
      >
        {getUserInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
