"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "landlord" | "renter";
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredRole && profile && profile.role !== requiredRole) {
      const redirect =
        profile.role === "landlord" ? "/landlord/properties" : "/renter/my-documents";
      router.replace(redirect);
    }
  }, [user, profile, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && profile && profile.role !== requiredRole) return null;

  return <>{children}</>;
}
