// src/session.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { setAuthToken } from "./api";

type Session = {
  token: string | null;
  role: "CUSTOMER" | "PROVIDER" | null;
};

type Ctx = {
  session: Session;
  signIn: (token: string, role: "CUSTOMER" | "PROVIDER") => void;
  signOut: () => void;
};

const SessionCtx = createContext<Ctx | null>(null);

// Always require fresh login on app start = keep everything in memory only
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ token: null, role: null });

  const value = useMemo(
    () => ({
      session,
      signIn: (token: string, role: "CUSTOMER" | "PROVIDER") => {
        setAuthToken(token);
        setSession({ token, role });
      },
      signOut: () => {
        setAuthToken(null);
        setSession({ token: null, role: null });
      },
    }),
    [session]
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}