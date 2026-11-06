export type AllergensStatus = "UNKNOWN" | "DECLARED";

export const DEFAULT_ALLERGENS_STATUS: AllergensStatus = "UNKNOWN";

export function allergenPayload(unknown: boolean, selected: string[]) {
  return {
    allergensStatus: unknown ? "UNKNOWN" as const : "DECLARED" as const,
    allergens: unknown ? [] : [...selected],
  };
}
