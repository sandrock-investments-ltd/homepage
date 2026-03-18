"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

type TenantRow = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  tenancy_status: string;
  property_address: string;
  tenancy_id: string;
};

export default function TenantsPage() {
  return (
    <AuthGuard requiredRole="landlord">
      <DashboardShell>
        <TenantsContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function TenantsContent() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTenants() {
    if (!user) return;

    // Get properties owned by this landlord
    const { data: properties } = await supabase
      .from("properties")
      .select("id, address_line_1")
      .eq("landlord_id", user.id);

    if (!properties?.length) {
      setLoading(false);
      return;
    }

    const propertyIds = properties.map((p) => p.id);
    const propertyMap = Object.fromEntries(
      properties.map((p) => [p.id, p.address_line_1])
    );

    // Get tenancies for these properties
    const { data: tenancies } = await supabase
      .from("tenancies")
      .select("id, property_id, renter_id, status")
      .in("property_id", propertyIds);

    if (!tenancies?.length) {
      setLoading(false);
      return;
    }

    const renterIds = tenancies.map((t) => t.renter_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, status")
      .in("id", renterIds);

    // Get emails from auth - we use the profile data we have
    const rows: TenantRow[] = tenancies.map((t) => {
      const profile = profiles?.find((p) => p.id === t.renter_id);
      return {
        id: t.renter_id,
        full_name: profile?.full_name ?? "Unknown",
        email: "",
        status: profile?.status ?? "unknown",
        tenancy_status: t.status,
        property_address: propertyMap[t.property_id] ?? "Unknown",
        tenancy_id: t.id,
      };
    });

    setTenants(rows);
    setLoading(false);
  }

  async function approveRenter(renterId: string) {
    await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", renterId);
    fetchTenants();
  }

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Tenants</h1>
      <p className="text-sm text-zinc-500">
        View and manage your tenants. Approve pending registrations.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading...</p>
      ) : tenants.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">
              No tenants yet. Invite renters from the Invitations page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {tenants.map((tenant) => (
            <Card key={tenant.tenancy_id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{tenant.full_name}</p>
                  <p className="text-sm text-zinc-500">
                    {tenant.property_address} &middot; Tenancy: {tenant.tenancy_status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={tenant.status === "active" ? "default" : "secondary"}
                  >
                    {tenant.status}
                  </Badge>
                  {tenant.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => approveRenter(tenant.id)}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
