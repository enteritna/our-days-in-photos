/**
 * Client-side interface lock for the opening screen.
 * This only hides the UI in the browser; it is NOT server-side security
 * (the site is public). Cloud photos are protected by account sign-in + RLS.
 */
export const LOCK_PASSWORD = "27072026";
export const UNLOCK_SESSION_KEY = "mylove:unlocked";

export function isCorrectPassword(input: string): boolean {
  return input.trim() === LOCK_PASSWORD;
}

/** Show the soft error only once the user typed something of plausible length or pressed Enter. */
export function shouldShowPasswordError(input: string, submitted: boolean): boolean {
  const value = input.trim();
  if (!value) return false;
  if (isCorrectPassword(value)) return false;
  return submitted || value.length >= LOCK_PASSWORD.length;
}
