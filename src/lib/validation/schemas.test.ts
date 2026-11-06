import { describe, expect, it } from "vitest";
import { fieldErrors, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./schemas";

describe("registerSchema", () => {
  const valid = { fullName: " Anass ", email: " Anass@Example.com ", phone: "", password: "a-long-password-1" };

  it("accepts valid data and trims the text", () => {
    const parsed = registerSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.fullName).toBe("Anass");
      expect(parsed.data.email).toBe("Anass@Example.com");
    }
  });

  it("accepts Good without requiring Excellent", () => {
    expect(registerSchema.safeParse({ ...valid, password: "GoodPass1!" }).success).toBe(true);
  });

  it("accepts Excellent as an optional stronger level", () => {
    expect(registerSchema.safeParse({ ...valid, password: "GoodPassword1!" }).success).toBe(true);
  });

  it("rejects a long password that is missing a required character group", () => {
    const result = registerSchema.safeParse({ ...valid, password: "GoodPassword123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).password).toContain("niveau Bon");
    }
  });

  it("enforces the 10 to 128 character length limits", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Good1!" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: `${"A".repeat(126)}1!` }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: `${"A".repeat(127)}1!` }).success).toBe(false);
  });

  it("reports one French message per field", () => {
    const result = registerSchema.safeParse({ fullName: "", email: "not-an-email", phone: "", password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.fullName).toBe("Ce champ est obligatoire.");
      expect(errors.email).toBe("Entrez une adresse e-mail valide.");
      expect(errors.password).toBe("Le mot de passe doit contenir au moins 10 caractères.");
    }
  });

  it("limits the length of the name and the phone number", () => {
    expect(registerSchema.safeParse({ ...valid, fullName: "x".repeat(121) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, phone: "1".repeat(31) }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("does not enforce the password length on login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("needs a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("needs two identical passwords that are at least Good", () => {
    const ok = resetPasswordSchema.safeParse({ password: "GoodPass1!", confirm: "GoodPass1!" });
    expect(ok.success).toBe(true);

    const excellent = resetPasswordSchema.safeParse({ password: "GoodPassword1!", confirm: "GoodPassword1!" });
    expect(excellent.success).toBe(true);

    const weak = resetPasswordSchema.safeParse({ password: "GoodPassword123", confirm: "GoodPassword123" });
    expect(weak.success).toBe(false);
    if (!weak.success) expect(fieldErrors(weak.error).password).toContain("niveau Bon");

    const mismatch = resetPasswordSchema.safeParse({ password: "GoodPass1!", confirm: "different-password" });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(fieldErrors(mismatch.error).confirm).toBe("Les deux mots de passe ne correspondent pas.");
  });
});
