import type { InputHTMLAttributes } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export const inputClass =
  "w-full min-h-12 rounded-2xl border-2 bg-white px-4 py-3 text-lg text-forest-900 placeholder:text-forest-400 " +
  "focus:border-forest-700 focus:outline-none aria-[invalid=true]:border-tomato-600";

export function TextField({ id, label, hint, error, className = "", ...props }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-bold text-forest-800">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`${inputClass} ${error ? "border-tomato-600" : "border-forest-200"} ${className}`}
      />
      {hint && !error && (
        <p id={hintId} className="text-base text-forest-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-base font-bold text-tomato-800">
          {error}
        </p>
      )}
    </div>
  );
}
