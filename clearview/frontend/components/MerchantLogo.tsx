"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";

const NAME_TO_DOMAIN: Record<string, string> = {
  netflix: "netflix.com",
  spotify: "spotify.com",
  "planet fitness": "planetfitness.com",
  "adobe creative cloud": "adobe.com",
  adobe: "adobe.com",
  "icloud 200gb": "apple.com",
  icloud: "apple.com",
  apple: "apple.com",
  "new york times": "nytimes.com",
  nytimes: "nytimes.com",
  "amazon prime": "amazon.com",
  amazon: "amazon.com",
  hulu: "hulu.com",
  "whole foods": "wholefoodsmarket.com",
  "trader joe's": "traderjoes.com",
  target: "target.com",
  uber: "uber.com",
  "uber eats": "ubereats.com",
  lyft: "lyft.com",
  starbucks: "starbucks.com",
  "mcdonald's": "mcdonalds.com",
  mcdonalds: "mcdonalds.com",
  chipotle: "chipotle.com",
  chase: "chase.com",
  marcus: "marcus.com",
  fidelity: "fidelity.com",
  google: "google.com",
  microsoft: "microsoft.com",
  youtube: "youtube.com",
  discord: "discord.com",
  slack: "slack.com",
  github: "github.com",
  dropbox: "dropbox.com",
  notion: "notion.so",
  figma: "figma.com",
};

function inferDomain(name: string): string | null {
  const lower = name.toLowerCase().trim();
  if (NAME_TO_DOMAIN[lower]) return NAME_TO_DOMAIN[lower];
  for (const [key, domain] of Object.entries(NAME_TO_DOMAIN)) {
    if (lower.includes(key) || key.includes(lower)) return domain;
  }
  return null;
}

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

  const resolvedDomain = domain || inferDomain(name);

  if (!resolvedDomain || failed) {
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
      src={`https://logo.clearbit.com/${resolvedDomain}`}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg object-contain flex-shrink-0 bg-white p-0.5"
      onError={() => setFailed(true)}
    />
  );
}
