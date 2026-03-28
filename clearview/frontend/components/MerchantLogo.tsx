"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";

export function MerchantLogo({
  domain,
  name,
  size = 32,
}: {
  domain: string | null;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return (
      <div
        className="rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <DollarSign size={size * 0.5} className="text-primary" />
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg object-contain flex-shrink-0 bg-white"
      onError={() => setFailed(true)}
    />
  );
}
