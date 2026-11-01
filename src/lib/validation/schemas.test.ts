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

  it("applies the same password rule as the API (10 to 128 characters)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "123456789" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "1234567890" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: "x".repeat(128) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: "x".repeat(129) }).success).toBe(false);
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
  it("needs two identical passwords", () => {
    const ok = resetPasswordSchema.safeParse({ password: "a-long-password-1", confirm: "a-long-password-1" });
    expect(ok.success).toBe(true);

    const bad = resetPasswordSchema.safeParse({ password: "a-long-password-1", confirm: "different-password" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(fieldErrors(bad.error).confirm).toBe("Les deux mots de passe ne correspondent pas.");
  });
});
