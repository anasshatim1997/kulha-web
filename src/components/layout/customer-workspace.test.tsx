import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  pathname: "/account",
  signOut: vi.fn(),
  sessionState: {
    status: "authenticated" as const,
    user: {
      id: "customer-1",
      email: "customer@example.com",
      fullName: "Samira Example",
      phone: null,
      emailVerified: true,
      roles: ["CUSTOMER"],
    },
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/session/SessionProvider", () => ({
  useSession: () => ({ state: mocks.sessionState, signOut: mocks.signOut, reload: vi.fn() }),
}));

vi.mock("@/components/feedback/ToastProvider", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { AccountPanel } from "@/components/auth/AccountPanel";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

describe("authenticated customer experience", () => {
  beforeEach(() => {
    mocks.pathname = "/account";
    mocks.sessionState = {
      status: "authenticated",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        fullName: "Samira Example",
        phone: null,
        emailVerified: true,
        roles: ["CUSTOMER"],
      },
    };
  });

  it("uses focused discover and profile navigation without marketing links or duplicate sign-out", () => {
    const html = renderToStaticMarkup(<SiteHeader />);
    expect(html).toContain('href="/offers"');
    expect(html).toContain('href="/account"');
    expect(html).toContain("Découvrir");
    expect(html).toContain("Mon profil");
    expect(html).not.toContain("Déconnexion");
    expect(html).not.toContain("Comment ça marche");
    expect(html).not.toContain("Pour les commerces");
  });

  it("removes the public marketing footer for an authenticated customer", () => {
    expect(renderToStaticMarkup(<SiteFooter />)).toBe("");
  });

  it("renders editable profile details in Arabic with right-to-left direction", () => {
    mocks.pathname = "/ar/account";
    const html = renderToStaticMarkup(<AccountPanel />);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("المعلومات الشخصية");
    expect(html).toContain('name="fullName"');
    expect(html).toContain('name="phone"');
  });

  it("renders the account space: profile card, reservations, details and exactly one sign-out action", () => {
    const html = renderToStaticMarkup(<AccountPanel />);
    expect(html).toContain("Bonjour, Samira");
    expect(html).toContain("Samira Example");
    expect(html).toContain("customer@example.com");
    expect(html).toContain('name="fullName"');
    expect(html).toContain('name="phone"');
    expect(html).toContain('name="email"');
    expect(html).toMatch(/readOnly=/i);
    expect(html).toContain("Informations personnelles");
    expect(html).toContain("Mes réservations");
    expect(html).toContain("Vous gérez un commerce ?");
    expect(html).toContain('href="/merchant/apply"');
    expect(html.match(/Se déconnecter/g)).toHaveLength(1);
    // A verified customer never sees the verification banner.
    expect(html).not.toContain("Renvoyer l’e-mail de confirmation");
  });

  it("shows the verification banner when the email is not verified", () => {
    mocks.sessionState = { ...mocks.sessionState, user: { ...mocks.sessionState.user, emailVerified: false } };
    const html = renderToStaticMarkup(<AccountPanel />);
    expect(html).toContain("Renvoyer l’e-mail de confirmation");
    expect(html).toContain("À confirmer");
  });
});
