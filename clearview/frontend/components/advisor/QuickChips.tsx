"use client";

interface QuickChipsProps {
  onSelect: (message: string) => void;
}

const CHIPS = [
  "Can I afford this?",
  "Where did my money go?",
  "Should I cancel any subscriptions?",
  "Am I on track this month?",
] as const;

export function QuickChips({ onSelect }: QuickChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(label)}
          className="bg-bg-tertiary border border-border-subtle rounded-full px-4 py-2 text-sm text-text-secondary hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue/30 cursor-pointer transition-all duration-200 text-left"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
