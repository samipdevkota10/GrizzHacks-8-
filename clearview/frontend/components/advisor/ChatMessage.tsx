"use client";

interface ChatMessageProps {
  role: "user" | "vera";
  content: string;
  timestamp: string;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex flex-col items-end gap-1 max-w-[80%] ml-auto">
        <div className="bg-accent-blue/20 text-text-primary rounded-2xl rounded-br-md p-3 text-sm leading-relaxed">
          {content}
        </div>
        <span className="text-xs text-text-muted">{formatTime(timestamp)}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 max-w-[80%] mr-auto">
      <div
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-vera-primary text-white text-xs font-semibold"
        aria-hidden
      >
        V
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="bg-vera-primary/10 text-text-primary rounded-2xl rounded-bl-md p-3 text-sm leading-relaxed">
          {content}
        </div>
        <span className="text-xs text-text-muted">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
