"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user, profile, loading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Sandrock Investments Limited
        </h1>
        <p className="mt-4 text-lg text-zinc-600">Renter Portal</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : user ? (
            <Link
              href={
                profile?.role === "landlord"
                  ? "/landlord/properties"
                  : "/renter/onboarding"
              }
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
