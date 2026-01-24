import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }
      
      setSubscriptionStatus({
        subscribed: data.subscribed,
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
    } else {
      setSubscriptionStatus(null);
    }
  }, [session, checkSubscription]);

  // Periodic subscription check (every 5 minutes)
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscriptionStatus(null);
  };

  const isPremium = subscriptionStatus?.subscribed ?? false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isPremium,
      subscriptionStatus,
      signUp, 
      signIn, 
      signOut,
      checkSubscription 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
