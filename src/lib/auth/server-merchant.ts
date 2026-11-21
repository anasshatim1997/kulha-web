import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./cookies";
import { localePath } from "@/lib/navigation";
import { backendRequest } from "./backend";

type CurrentUser = { roles?: string[] };

export async function requireMerchantPage(locale: string): Promise<boolean> {
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
  if (!user.roles?.some(role => ["MERCHANT", "MERCHANT_OWNER", "MERCHANT_STAFF"].includes(role))) redirect(localePath(locale as "fr" | "en" | "ar", "/merchant/dashboard"));
  return user.roles.some(role => ["MERCHANT", "MERCHANT_OWNER"].includes(role));
}
