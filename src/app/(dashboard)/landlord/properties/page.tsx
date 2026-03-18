"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { PROPERTY_TYPES } from "@/lib/constants";
import type { Database } from "@/types/database";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export default function PropertiesPage() {
  return (
    <AuthGuard requiredRole="landlord">
      <DashboardShell>
        <PropertiesContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function PropertiesContent() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchProperties() {
    if (!user) return;
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });
    setProperties(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Properties</h1>
          <p className="text-sm text-zinc-500">Manage your rental properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button>Add Property</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Property</DialogTitle>
            </DialogHeader>
            <AddPropertyForm
              onSuccess={() => {
                setDialogOpen(false);
                fetchProperties();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading...</p>
      ) : properties.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">No properties yet. Add your first property to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.address_line_1}</CardTitle>
                <CardDescription>
                  {property.city}, {property.postcode}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{property.property_type}</Badge>
                  <span className="text-sm text-zinc-500">
                    {property.bedrooms} bed{property.bedrooms !== 1 && "s"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPropertyForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const { error } = await supabase.from("properties").insert({
      landlord_id: user!.id,
      address_line_1: form.get("address_line_1") as string,
      address_line_2: (form.get("address_line_2") as string) || null,
      city: form.get("city") as string,
      postcode: form.get("postcode") as string,
      property_type: form.get("property_type") as string,
      bedrooms: parseInt(form.get("bedrooms") as string),
      house_rules: (form.get("house_rules") as string) || null,
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
      <div className="space-y-2">
        <Label htmlFor="address_line_1">Address Line 1</Label>
        <Input id="address_line_1" name="address_line_1" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line_2">Address Line 2</Label>
        <Input id="address_line_2" name="address_line_2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" name="postcode" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Property Type</Label>
          <select
            name="property_type"
            required
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Select...</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" name="bedrooms" type="number" min={0} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="house_rules">House Rules (optional)</Label>
        <Textarea id="house_rules" name="house_rules" rows={3} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add Property"}
      </Button>
    </form>
  );
}
