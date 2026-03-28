"use client";

import { twMerge } from "tailwind-merge";

export type MerchantLogoProps = {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
};

export function MerchantLogo({
  name,
  logoUrl,
  size = 40,
  className,
}: MerchantLogoProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dimensionStyle = { width: size, height: size };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={twMerge("shrink-0 rounded-full object-cover", className)}
        style={dimensionStyle}
      />
    );
  }

  return (
    <div
      className={twMerge(
        "flex shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-text-primary",
        className
      )}
      style={dimensionStyle}
      aria-hidden
    >
      <span className="font-medium">{initial}</span>
    </div>
  );
}
