/** MongoDB ObjectId string: 24 hex characters */
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function isValidMongoObjectId(id: string | null | undefined): boolean {
  return typeof id === "string" && OBJECT_ID_RE.test(id.trim());
}

/** Resolve user id: env (build-time) then localStorage. Client-only after mount. */
export function readClearviewUserIdFromStorage(): string | null {
  const envId = process.env.NEXT_PUBLIC_CLEARVIEW_USER_ID?.trim();
  if (isValidMongoObjectId(envId)) return envId!;

  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("clearview_user_id");
  return isValidMongoObjectId(stored) ? stored!.trim() : null;
}
