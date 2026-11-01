import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "accent" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-lg font-extrabold " +
  "transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 min-h-12";

const variants: Record<Variant, string> = {
  primary: "bg-forest-700 text-cream hover:bg-forest-800 shadow-soft",
  accent: "bg-sun-500 text-forest-900 hover:bg-sun-600 shadow-soft",
  ghost: "border-2 border-forest-700 text-forest-700 hover:bg-forest-50",
  danger: "bg-tomato-600 text-white hover:bg-tomato-800",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean };

export function Button({ variant = "primary", loading = false, disabled, className = "", children, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, className)}>
      {loading && <span className="button-loading-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant };

export function LinkButton({ variant = "primary", className = "", ...props }: LinkButtonProps) {
  return <Link {...props} className={buttonClass(variant, className)} />;
}
