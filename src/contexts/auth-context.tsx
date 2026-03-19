"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthState = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: "landlord" | "renter",
    phone?: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      return data;
    }

    // Profile missing — the DB trigger may not have run. Try to create it
    // from the user's metadata as a fallback.
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const meta = currentUser?.user_metadata;
    if (meta?.role && meta?.full_name) {
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: meta.full_name,
          role: meta.role,
          phone: meta.phone ?? null,
          status: meta.role === "landlord" ? "active" : "pending",
        })
        .select()
        .single();

      if (createError) {
        console.error("Fallback profile creation failed:", createError.message);
      } else if (created) {
        setProfile(created);
        return created;
      }
    }

    setProfile(null);
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Wait for profile fetch to complete before marking as loaded
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: "landlord" | "renter",
    phone?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone: phone ?? null },
      },
    });

    if (error) return { error: error.message, needsEmailConfirmation: false };

    // If email confirmation is enabled, the user is created but there's no
    // active session. The DB trigger (handle_new_user) will create the profile.
    // We just need to tell the UI to show a "check your email" message.
    const hasSession = !!data.session;

    if (!hasSession) {
      return { error: null, needsEmailConfirmation: true };
    }

    // Session exists (email confirmation disabled) — ensure profile exists.
    // The DB trigger should have created it, but upsert as a safety net.
    if (data.user) {
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role,
        phone: phone ?? null,
        status: role === "landlord" ? "active" : "pending",
      });

      if (upsertError) {
        console.error("Failed to create profile:", upsertError.message);
        // Don't fail — the trigger may have created the profile already
      }
    }

    return { error: null, needsEmailConfirmation: false };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
