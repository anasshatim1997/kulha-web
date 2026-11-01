import type { ReactNode } from "react";

type Tone = "green" | "yellow" | "red" | "neutral";

const tones: Record<Tone, string> = {
  green: "bg-leaf-50 text-leaf-800",
  yellow: "bg-sun-100 text-forest-900",
  red: "bg-tomato-50 text-tomato-800",
  neutral: "bg-forest-100 text-forest-800",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-extrabold ${tones[tone]}`}>{children}</span>;
}
