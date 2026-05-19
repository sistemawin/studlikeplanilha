"use client";

import { UserRound } from "lucide-react";

type Props = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "lg";
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

export function ProfileAvatar({ name, email, avatarUrl, size = "lg" }: Props) {
  const dimension = size === "lg" ? "h-24 w-24 text-2xl" : "h-11 w-11 text-sm";
  const iconSize = size === "lg" ? "h-9 w-9" : "h-5 w-5";
  const initials = getInitials(name, email);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 via-white to-slate-100 font-extrabold text-[#1877F2] shadow-sm shadow-slate-900/10 ring-1 ring-slate-900/10 ${dimension}`}
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
