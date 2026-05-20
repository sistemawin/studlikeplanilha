"use client";

import { UserRound } from "lucide-react";

type Props = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "lg";
  sizeClass?: string;
};

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "Usuário";
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export function ProfileAvatar({ name, email, avatarUrl, size = "lg", sizeClass }: Props) {
  const dimension = sizeClass ?? (size === "lg" ? "h-24 w-24 text-2xl" : "h-11 w-11 text-sm");
  const iconSize = size === "lg" ? "h-9 w-9" : "h-5 w-5";
  const initials = getInitials(name, email);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-gradient-to-br from-blue-50 via-white to-slate-100 font-extrabold text-[#1877F2] shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-white/80 ${dimension}`}
      aria-label={name || email || "Perfil do usuário"}
    >
      {avatarUrl ? (
        <span
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${avatarUrl})` }}
          aria-hidden="true"
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserRound className={iconSize} aria-hidden="true" />
      )}
    </div>
  );
}
