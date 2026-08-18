import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Avatar } from "./Avatar";
import { RatingDisplay } from "./RatingDisplay";
import type { UserResponse } from "@/types";

interface UserBadgeProps {
  user: Pick<
    UserResponse,
    "id" | "username" | "full_name" | "profile_photo_url" | "rating_avg" | "rating_count" | "location"
  >;
  linkToProfile?: boolean;
}

export function UserBadge({ user, linkToProfile = true }: UserBadgeProps) {
  const content = (
    <div className="flex items-center gap-3">
      <Avatar src={user.profile_photo_url} name={user.full_name ?? user.username} size="lg" />
      <div className="min-w-0">
        <p className="truncate font-medium text-textPrimary">{user.full_name ?? user.username}</p>
        <p className="truncate text-sm text-textSecondary">@{user.username}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <RatingDisplay value={user.rating_avg} count={user.rating_count} />
          {user.location && (
            <span className="flex items-center gap-1 text-sm text-textSecondary">
              <MapPin className="size-3.5" />
              {user.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!linkToProfile) return content;

  return (
    <Link
      to="/users/$id"
      params={{ id: user.id }}
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40"
    >
      {content}
    </Link>
  );
}
