"use client";

import { useMemo, useState, type InputHTMLAttributes } from "react";
import { messages } from "@/lib/i18n/messages";
import { getPasswordStrength } from "@/lib/auth/password-strength";
import { inputClass } from "./TextField";

type StrengthCopy = {
  title: string;
  required: string;
  maximum: string;
  letters: string;
  number: string;
  symbol: string;
  longer: string;
  levels: [string, string, string, string, string, string];
  invalid: string;
  recommended: string;
};

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  showLabel?: string;
  hideLabel?: string;
  strengthCopy?: StrengthCopy;
};

export function PasswordField({
  id,
  label,
  hint,
  error,
  showLabel,
  hideLabel,
  strengthCopy,
  className = "",
  value,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const password = typeof value === "string" ? value : "";
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const strengthId = strengthCopy ? `${id}-strength` : undefined;

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthLevel = password.length > 128 ? "invalid" : strength.score <= 1 ? "weak" : strength.score <= 3 ? "medium" : "strong";
  const strengthLabel = password.length > 128 ? strengthCopy?.invalid : strengthCopy?.levels[strength.score];
  const describedBy = [hintId, errorId, strengthId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="password-field space-y-1.5">
      <label htmlFor={id} className="block text-base font-bold text-forest-800">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          value={value}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass} pr-24 ${error ? "border-tomato-600" : "border-forest-200"} ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? (hideLabel ?? messages.common.hide) : (showLabel ?? messages.common.show)}
          className="password-toggle absolute inset-y-0 right-2 my-auto h-9 rounded-xl px-3 text-base font-bold text-forest-700 hover:bg-forest-50"
        >
          {visible ? (hideLabel ?? messages.common.hide) : (showLabel ?? messages.common.show)}
        </button>
      </div>
      {hint && !error && <p id={hintId} className="text-sm text-forest-600">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-sm font-bold text-tomato-800">{error}</p>}

      {strengthCopy && (
        <div id={strengthId} className={`password-strength is-${strengthLevel}`} aria-live="polite">
          <div className="password-strength-heading">
            <span>{strengthCopy.title}</span>
            <strong>{strengthLabel}</strong>
          </div>
          <div
            className="password-strength-track"
            role="progressbar"
            aria-label={strengthCopy.title}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={strength.score}
          >
            <span style={{ width: `${strength.percent}%` }} />
          </div>
          <div className="password-strength-rules">
            <p className="password-strength-recommended">{strengthCopy.recommended}</p>
            <ul>
              <li className={strength.checks.minimum ? "is-met" : ""}><i aria-hidden="true">{strength.checks.minimum ? "✓" : "○"}</i>{strengthCopy.required}</li>
              <li className={strength.checks.maximum ? "is-met" : ""}><i aria-hidden="true">{strength.checks.maximum ? "✓" : "○"}</i>{strengthCopy.maximum}</li>
              <li className={strength.checks.letters ? "is-met" : ""}><i aria-hidden="true">{strength.checks.letters ? "✓" : "○"}</i>{strengthCopy.letters}</li>
              <li className={strength.checks.number ? "is-met" : ""}><i aria-hidden="true">{strength.checks.number ? "✓" : "○"}</i>{strengthCopy.number}</li>
              <li className={strength.checks.symbol ? "is-met" : ""}><i aria-hidden="true">{strength.checks.symbol ? "✓" : "○"}</i>{strengthCopy.symbol}</li>
              <li className={strength.checks.longer ? "is-met" : ""}><i aria-hidden="true">{strength.checks.longer ? "✓" : "○"}</i>{strengthCopy.longer}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
