"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, authApi } from "@/lib/api/client";

export type Me = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  emailVerified: boolean;
  roles: string[];
};

export type SessionState = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: Me };

type SessionValue = {
  state: SessionState;
  /** Loads the current user again, for example right after a login. */
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const reload = useCallback(async () => {
    try {
      const user = await api.get<Me>("/me");
      setState({ status: "authenticated", user });
    } catch {
      setState({ status: "anonymous" });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setState({ status: "anonymous" });
      window.dispatchEvent(new Event("kulha:navigation-start"));
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Me>("/me")
      .then((user) => {
        if (!cancelled) setState({ status: "authenticated", user });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ state, reload, signOut }), [state, reload, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
