"use client";

import { cn } from "@/lib/utils";

interface ClientAvatarProps {
  name: string;
  id: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-orange-100 text-orange-800",
  "bg-yellow-100 text-yellow-800",
  "bg-stone-100 text-stone-700",
  "bg-red-100 text-red-800",
  "bg-rose-100 text-rose-800",
] as const;

function pickColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  if (parts.length >= 2 && second) return (first[0]! + second[0]!).toUpperCase();
  return first.slice(0, 2).toUpperCase();
}

const sizeClasses = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-12 text-base",
};

export function ClientAvatar({ name, id, size = "md", className }: ClientAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClasses[size],
        pickColor(id),
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
