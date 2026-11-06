export type OfferProblem = {
  detail?: string;
  fieldErrors: Record<string, string>;
};

export function parseOfferProblem(value: unknown): OfferProblem {
  if (typeof value !== "object" || value === null) return { fieldErrors: {} };
  const record = value as Record<string, unknown>;
  const detail = typeof record.detail === "string" ? record.detail : undefined;
  const fieldErrors: Record<string, string> = {};
  if (typeof record.fieldErrors === "object" && record.fieldErrors !== null) {
    for (const [field, message] of Object.entries(record.fieldErrors as Record<string, unknown>)) {
      if (typeof message === "string" && message.trim()) fieldErrors[field] = message;
    }
  }
  return { detail, fieldErrors };
}
