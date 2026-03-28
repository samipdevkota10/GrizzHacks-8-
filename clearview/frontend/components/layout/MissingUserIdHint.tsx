"use client";

export function MissingUserIdHint() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center">
      <h2 className="mb-2 text-xl font-semibold text-text-primary">Set your demo user id</h2>
      <p className="mb-4 text-sm text-text-secondary">
        The API expects a MongoDB user id (24 hex characters) from{" "}
        <code className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-xs">
          python seed_data.py
        </code>{" "}
        in <code className="font-mono text-xs">clearview/backend</code>.
      </p>
      <p className="mb-2 text-left text-xs text-text-muted">
        In the browser console (F12 → Console), run:
      </p>
      <pre className="mb-4 overflow-x-auto rounded-lg bg-bg-tertiary p-3 text-left font-mono text-[11px] text-accent-blue">
        {`localStorage.setItem("clearview_user_id", "YOUR_24_CHAR_HEX_ID");\nlocation.reload();`}
      </pre>
      <p className="text-xs text-text-secondary">
        Optional: add{" "}
        <code className="rounded bg-bg-tertiary px-1 font-mono text-[11px]">
          NEXT_PUBLIC_CLEARVIEW_USER_ID=...
        </code>{" "}
        to <code className="font-mono text-[11px]">.env.local</code> and restart{" "}
        <code className="font-mono text-[11px]">npm run dev</code>.
      </p>
    </div>
  );
}
