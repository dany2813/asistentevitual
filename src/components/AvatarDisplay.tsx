import { useState } from "react";

interface AvatarDisplayProps {
  avatar?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarDisplayProps["size"]>, string> = {
  xs: "w-6 h-6 text-xs rounded-md",
  sm: "w-8 h-8 text-sm rounded-lg",
  md: "w-10 h-10 text-lg rounded-xl",
  lg: "w-12 h-12 text-xl rounded-xl",
  xl: "w-16 h-16 text-3xl rounded-2xl",
};

export function isImageAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:image/") ||
    avatar.startsWith("/")
  );
}

export function AvatarDisplay({
  avatar,
  alt = "Avatar",
  size = "md",
  fallback = "🤖",
}: AvatarDisplayProps) {
  const [failed, setFailed] = useState(false);
  const value = avatar?.trim() || fallback;
  const sizeCls = SIZE_CLASSES[size];

  if (isImageAvatar(value) && !failed) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden bg-[#F3F5F8] border border-[#DBDBDB] shrink-0 ${sizeCls}`}
      >
        <img
          src={value}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-[#F3F5F8] border border-[#DBDBDB] select-none shrink-0 ${sizeCls}`}
      aria-hidden="true"
    >
      {failed ? fallback : value}
    </span>
  );
}
