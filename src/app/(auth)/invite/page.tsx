"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Invitation = Database["public"]["Tables"]["invitations"]["Row"];

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-sm text-zinc-500">Loading...</p></div>}>
      <InviteAcceptContent />
    </Suspense>
  );
}

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { signUp } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function fetchInvite() {
      if (!token) {
        setError("No invitation token provided");
        setLoading(false);
        return;
      }

      const { data: invitations } = await supabase
        .from("invitations")
        .select()
        .eq("token", token)
        .eq("status", "pending" as const)
        .limit(1);

      const inv = invitations?.[0] as Database["public"]["Tables"]["invitations"]["Row"] | undefined;

      if (!inv) {
        setError("Invitation not found or already used");
        setLoading(false);
        return;
      }

      if (new Date(inv.expires_at) < new Date()) {
        setError("This invitation has expired");
        setLoading(false);
        return;
      }

      setInvitation(inv);
      setEmail(inv.email);
      if (inv.renter_name) setFullName(inv.renter_name);

      const { data: props } = await supabase
        .from("properties")
        .select("address_line_1, postcode")
        .eq("id", inv.property_id)
        .limit(1);

      const prop = props?.[0];

      if (prop) {
        setPropertyAddress(`${prop.address_line_1}, ${prop.postcode}`);
      }

      setLoading(false);
    }
    fetchInvite();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invitation) return;
    setSubmitting(true);
    setError(null);

    const { error: signUpError } = await signUp(
      email,
      password,
      fullName,
      "renter",
      phone || undefined
    );

    if (signUpError) {
      setError(signUpError);
      setSubmitting(false);
      return;
    }

    // Get the new user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Activate the profile
      await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", user.id);

      // Create tenancy
      await supabase.from("tenancies").insert({
        property_id: invitation.property_id,
        renter_id: user.id,
        lease_start: invitation.lease_start ?? new Date().toISOString().split("T")[0],
        rent_amount_pence: invitation.rent_amount_pence ?? 0,
        status: "active",
      });

      // Mark invitation as accepted
      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);
    }

    router.push("/renter/onboarding");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading invitation...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join {propertyAddress || "a property"} on the
            Sandrock Renter Portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Accept & Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
