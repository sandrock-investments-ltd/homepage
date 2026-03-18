"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type Tenancy = Database["public"]["Tables"]["tenancies"]["Row"];

export default function MyPropertyPage() {
  return (
    <AuthGuard requiredRole="renter">
      <DashboardShell>
        <PropertyContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function PropertyContent() {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) return;

      const { data: tenancies } = await supabase
        .from("tenancies")
        .select("*")
        .eq("renter_id", user.id)
        .limit(1);

      const t = tenancies?.[0] ?? null;
      setTenancy(t);

      if (t) {
        const { data: prop } = await supabase
          .from("properties")
          .select("*")
          .eq("id", t.property_id)
          .single();
        setProperty(prop);
      }

      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  if (!tenancy || !property) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Property</h1>
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">
              No property assigned yet. Your landlord will set this up for you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPence = (pence: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(pence / 100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">My Property</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Details about your rented property
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{property.address_line_1}</p>
            {property.address_line_2 && <p>{property.address_line_2}</p>}
            <p>
              {property.city}, {property.postcode}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary">{property.property_type}</Badge>
              <span className="text-zinc-500">
                {property.bedrooms} bedroom{property.bedrooms !== 1 && "s"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenancy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Lease Start</span>
              <span>{new Date(tenancy.lease_start).toLocaleDateString()}</span>
            </div>
            {tenancy.lease_end && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Lease End</span>
                <span>
                  {new Date(tenancy.lease_end).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Rent</span>
              <span>
                {formatPence(tenancy.rent_amount_pence)} / {tenancy.rent_frequency}
              </span>
            </div>
            {tenancy.deposit_amount_pence && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Deposit</span>
                <span>{formatPence(tenancy.deposit_amount_pence)}</span>
              </div>
            )}
            {tenancy.deposit_scheme && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Deposit Scheme</span>
                <span>{tenancy.deposit_scheme}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {property.house_rules && (
          <Card>
            <CardHeader>
              <CardTitle>House Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{property.house_rules}</p>
            </CardContent>
          </Card>
        )}

        {(property.wifi_details || property.utility_info || property.bin_collection_day) && (
          <Card>
            <CardHeader>
              <CardTitle>Useful Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {property.wifi_details && (
                <div>
                  <span className="font-medium">WiFi:</span> {property.wifi_details}
                </div>
              )}
              {property.utility_info && (
                <div>
                  <span className="font-medium">Utilities:</span>{" "}
                  {property.utility_info}
                </div>
              )}
              {property.bin_collection_day && (
                <div>
                  <span className="font-medium">Bin Collection:</span>{" "}
                  {property.bin_collection_day}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {property.emergency_contacts &&
          Array.isArray(property.emergency_contacts) &&
          (property.emergency_contacts as Array<{ name: string; phone: string }>).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(property.emergency_contacts as Array<{ name: string; phone: string }>).map(
                  (contact, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{contact.name}</span>
                      <span className="text-zinc-500">{contact.phone}</span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
