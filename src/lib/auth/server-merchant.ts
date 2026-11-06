import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./cookies";
import { backendRequest } from "./backend";

type CurrentUser = { roles?: string[] };

export async function requireMerchantPage(locale: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) redirect(`/${locale}/login`);
  let user: CurrentUser | null = null;
  try {
    const response = await backendRequest("/api/v1/me", { method: "GET", accessToken });
    if (response.ok) user = await response.json() as CurrentUser;
  } catch {
    user = null;
  }
  if (!user) redirect(`/${locale}/login`);
  if (!user.roles?.includes("MERCHANT")) redirect(`/${locale}/merchant/dashboard`);
}
