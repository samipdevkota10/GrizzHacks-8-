"use client";

import { useState } from "react";

const NAME_TO_DOMAIN: Record<string, string> = {
  netflix: "netflix.com",
  spotify: "spotify.com",
  "planet fitness": "planetfitness.com",
  "adobe creative cloud": "adobe.com",
  adobe: "adobe.com",
  "icloud 200gb": "apple.com",
  "icloud+": "apple.com",
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
  walmart: "walmart.com",
  kroger: "kroger.com",
  aldi: "aldi.us",
  "taco bell": "tacobell.com",
  "chick-fil-a": "chick-fil-a.com",
  "domino's": "dominos.com",
  dominos: "dominos.com",
  "shell gas": "shell.com",
  shell: "shell.com",
  "bp gas": "bp.com",
  bp: "bp.com",
  "t-mobile": "t-mobile.com",
  tmobile: "t-mobile.com",
  comcast: "xfinity.com",
  "comcast internet": "xfinity.com",
  xfinity: "xfinity.com",
  venmo: "venmo.com",
  "best buy": "bestbuy.com",
  bestbuy: "bestbuy.com",
  "chatgpt plus": "openai.com",
  chatgpt: "openai.com",
  openai: "openai.com",
  "xbox game pass": "xbox.com",
  xbox: "xbox.com",
  steam: "store.steampowered.com",
  ticketmaster: "ticketmaster.com",
  "amc theatres": "amctheatres.com",
  amc: "amctheatres.com",
  eventbrite: "eventbrite.com",
  "wells fargo": "wellsfargo.com",
  discover: "discover.com",
};

const BRAND_COLORS: Record<string, string> = {
  netflix: "#E50914",
  spotify: "#1DB954",
  "planet fitness": "#5A2D82",
  adobe: "#FF0000",
  apple: "#A2AAAD",
  "new york times": "#1A1A1A",
  amazon: "#FF9900",
  hulu: "#1CE783",
  "whole foods": "#00674B",
  "trader joe's": "#BA2026",
  target: "#CC0000",
  uber: "#000000",
  lyft: "#FF00BF",
  starbucks: "#00704A",
  mcdonalds: "#FFC72C",
  chipotle: "#A81612",
  chase: "#117ACA",
  marcus: "#1B1B1B",
  fidelity: "#4B8B3B",
  walmart: "#0071CE",
  kroger: "#0468B1",
  aldi: "#00005F",
  "taco bell": "#702082",
  "chick-fil-a": "#E51636",
  "domino's": "#006491",
  dominos: "#006491",
  shell: "#FFD500",
  bp: "#009A44",
  "t-mobile": "#E20074",
  comcast: "#6138f5",
  xfinity: "#6138f5",
  venmo: "#008CFF",
  "best buy": "#0046BE",
  openai: "#10A37F",
  chatgpt: "#10A37F",
  xbox: "#107C10",
  steam: "#1B2838",
  ticketmaster: "#026CDF",
  amc: "#E32636",
  eventbrite: "#F05537",
  "wells fargo": "#D71E28",
  discover: "#FF6600",
};

function inferDomain(name: string): string | null {
  const lower = name.toLowerCase().trim();
  if (NAME_TO_DOMAIN[lower]) return NAME_TO_DOMAIN[lower];
  for (const [key, domain] of Object.entries(NAME_TO_DOMAIN)) {
    if (lower.includes(key) || key.includes(lower)) return domain;
  }
  return null;
}

function getBrandColor(name: string): string {
  const lower = name.toLowerCase().trim();
  if (BRAND_COLORS[lower]) return BRAND_COLORS[lower];
  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    if (lower.includes(key) || key.includes(lower)) return color;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 45%)`;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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
    const bg = getBrandColor(name);
    const initials = getInitials(name);
    const fontSize = Math.max(10, size * 0.38);
    return (
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold select-none"
        style={{ width: size, height: size, backgroundColor: bg, fontSize }}
      >
        {initials}
      </div>
    );
  }

  const logoUrl = `https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=${Math.min(size * 2, 256)}`;

  return (
    <img
      src={logoUrl}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg object-contain flex-shrink-0"
      onError={() => setFailed(true)}
    />
  );
}
