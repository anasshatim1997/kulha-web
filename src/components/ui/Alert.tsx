import type { ReactNode } from "react";

type Tone = "success" | "error" | "info";

const tones: Record<Tone, string> = {
  success: "border-leaf-500 bg-leaf-50 text-leaf-800",
  error: "border-tomato-500 bg-tomato-50 text-tomato-800",
  info: "border-sun-500 bg-sun-100 text-forest-900",
};

export function Alert({ tone, title, children }: { tone: Tone; title?: string; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border-2 px-4 py-3 text-base ${tones[tone]}`}>
      {title && <p className="mb-0.5 font-extrabold">{title}</p>}
      <div className="font-semibold">{children}</div>
    </div>
  );
}
