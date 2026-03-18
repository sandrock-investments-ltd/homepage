"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
type Property = Database["public"]["Tables"]["properties"]["Row"];

export default function InvitationsPage() {
  return (
    <AuthGuard requiredRole="landlord">
      <DashboardShell>
        <InvitationsContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function InvitationsContent() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchData() {
    if (!user) return;
    const [invRes, propRes] = await Promise.all([
      supabase
        .from("invitations")
        .select("*")
        .eq("invited_by", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id),
    ]);
    setInvitations(invRes.data ?? []);
    setProperties(propRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getPropertyAddress = (id: string) =>
    properties.find((p) => p.id === id)?.address_line_1 ?? "Unknown";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Invitations</h1>
          <p className="text-sm text-zinc-500">Invite renters to your properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button>Invite Renter</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Renter</DialogTitle>
            </DialogHeader>
            <InviteForm
              properties={properties}
              onSuccess={() => {
                setDialogOpen(false);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading...</p>
      ) : invitations.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">
              No invitations sent yet. Add a property first, then invite renters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">
                    {inv.renter_name || inv.email}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {inv.email} &middot; {getPropertyAddress(inv.property_id)}
                  </p>
                </div>
                <Badge
                  variant={
                    inv.status === "accepted"
                      ? "default"
                      : inv.status === "expired"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {inv.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteForm({
  properties,
  onSuccess,
}: {
  properties: Property[];
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const rentStr = form.get("rent_amount") as string;

    const { error } = await supabase.from("invitations").insert({
      property_id: form.get("property_id") as string,
      invited_by: user!.id,
      email: form.get("email") as string,
      token,
      renter_name: (form.get("renter_name") as string) || null,
      lease_start: (form.get("lease_start") as string) || null,
      rent_amount_pence: rentStr ? Math.round(parseFloat(rentStr) * 100) : null,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {properties.length === 0 ? (
        <p className="text-sm text-zinc-500">Add a property first before inviting renters.</p>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Property</Label>
            <select
              name="property_id"
              required
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Select property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address_line_1}, {p.postcode}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Renter Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renter_name">Renter Name (optional)</Label>
            <Input id="renter_name" name="renter_name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lease_start">Lease Start</Label>
              <Input id="lease_start" name="lease_start" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Monthly Rent (&pound;)</Label>
              <Input
                id="rent_amount"
                name="rent_amount"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </>
      )}
    </form>
  );
}
