import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { ready: boolean; session: Session | null; user: User | null };

const AuthContext = createContext<AuthState>({ ready: false, session: null, user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ready: false, session: null, user: null });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, session, user: session?.user ?? null });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ ready: true, session, user: session?.user ?? null });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
