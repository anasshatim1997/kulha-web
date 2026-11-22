import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./cookies";
import { localePath } from "@/lib/navigation";
import { backendRequest } from "./backend";
import { canAccessAdminWorkspace, canAccessSupportCases } from "./admin-access";

type CurrentUser = { roles?: string[] };

export async function requireAdminPage(locale: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) redirect(localePath(locale as "fr" | "en" | "ar", "/login"));
  let user: CurrentUser | null = null;
  try {
    const response = await backendRequest("/api/v1/me", { method: "GET", accessToken });
    if (response.ok) user = await response.json() as CurrentUser;
  } catch {
    user = null;
  }
  if (!user) redirect(localePath(locale as "fr" | "en" | "ar", "/login"));
  if (!user.roles || !canAccessAdminWorkspace(user.roles)) {
    redirect(localePath(locale as "fr" | "en" | "ar", "/offers"));
  }
}


/** Allows support agents into the case workspace only; other admin routes stay restricted. */
export async function requireSupportCasesPage(locale: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) redirect(localePath(locale as "fr" | "en" | "ar", "/login"));
  let user: CurrentUser | null = null;
  try {
    const response = await backendRequest("/api/v1/me", { method: "GET", accessToken });
    if (response.ok) user = await response.json() as CurrentUser;
  } catch {
    user = null;
  }
  if (!user) redirect(localePath(locale as "fr" | "en" | "ar", "/login"));
  if (!user.roles || !canAccessSupportCases(user.roles)) {
    redirect(localePath(locale as "fr" | "en" | "ar", "/offers"));
  }
}
