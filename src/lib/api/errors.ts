import { messages } from "@/lib/i18n/messages";
import { ApiError } from "./client";

/** A French message for any error, without leaking technical details. */
export function describeError(error: unknown, overrides: Partial<Record<number, string>> = {}): string {
  if (!(error instanceof ApiError)) return messages.errors.generic;
  if (error.isNetworkError) return messages.errors.network;
  const override = overrides[error.status];
  if (override) return override;
  switch (error.status) {
    case 400:
      return messages.errors.invalidInput;
    case 401:
      return messages.errors.sessionExpired;
    case 403:
      return messages.errors.forbidden;
    case 404:
      return messages.errors.notFound;
    case 409:
      return messages.errors.conflict;
    case 408:
      return messages.errors.unavailable;
    case 429:
      return messages.errors.tooManyRetry(Math.ceil((error.retryAfterSeconds ?? 60) / 60));
    case 502:
    case 503:
    case 504:
      return messages.errors.unavailable;
    default:
      return messages.errors.generic;
  }
}
