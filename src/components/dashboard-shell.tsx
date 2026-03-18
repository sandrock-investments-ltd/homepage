"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

const LANDLORD_NAV: NavItem[] = [
  { href: "/landlord/properties", label: "Properties" },
  { href: "/landlord/tenants", label: "Tenants" },
  { href: "/landlord/invitations", label: "Invitations" },
  { href: "/landlord/documents", label: "Documents" },
];

const RENTER_NAV: NavItem[] = [
  { href: "/renter/onboarding", label: "Onboarding" },
  { href: "/renter/my-documents", label: "My Documents" },
  { href: "/renter/my-property", label: "My Property" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  const nav = profile?.role === "landlord" ? LANDLORD_NAV : RENTER_NAV;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold text-zinc-900">
              Sandrock Investments
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {profile?.full_name}
              {profile?.role && (
                <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-xs capitalize">
                  {profile.role}
                </span>
              )}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
