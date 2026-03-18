"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase/client";
import { REQUIRED_RENTER_DOCUMENTS, ALL_DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { Database } from "@/types/database";

type Document = Database["public"]["Tables"]["documents"]["Row"];

type ChecklistItem = {
  category: string;
  label: string;
  status: "missing" | "pending" | "accepted" | "more_info_needed";
};

export default function OnboardingPage() {
  return (
    <AuthGuard requiredRole="renter">
      <DashboardShell>
        <OnboardingContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function OnboardingContent() {
  const { user, profile } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) return;

      const { data: tenancies } = await supabase
        .from("tenancies")
        .select("id")
        .eq("renter_id", user.id)
        .limit(1);

      const tenancy = tenancies?.[0];
      let docs: Document[] = [];

      if (tenancy) {
        const { data } = await supabase
          .from("documents")
          .select("*")
          .eq("tenancy_id", tenancy.id)
          .eq("uploaded_by", user.id);
        docs = data ?? [];
      }

      const items: ChecklistItem[] = REQUIRED_RENTER_DOCUMENTS.map((cat) => {
        const label =
          ALL_DOCUMENT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

        // Find the latest version of this category
        const catDocs = docs
          .filter((d) => d.category === cat)
          .sort((a, b) => b.version - a.version);
        const latest = catDocs[0];

        return {
          category: cat,
          label,
          status: latest
            ? (latest.review_status as ChecklistItem["status"])
            : "missing",
        };
      });

      setChecklist(items);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const completedCount = checklist.filter((i) => i.status === "accepted").length;
  const progress =
    checklist.length > 0
      ? Math.round((completedCount / checklist.length) * 100)
      : 0;

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Onboarding</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Complete these steps to finish your tenancy setup
      </p>

      {profile?.status === "pending" && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              Your account is pending approval from your landlord. You can still
              start uploading documents.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-zinc-500">
                {completedCount} of {checklist.length} documents accepted
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={item.status} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.status !== "accepted" && (
                    <Link
                      href="/renter/my-documents"
                      className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
                    >
                      {item.status === "missing" ? "Upload" : "Update"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIcon({ status }: { status: ChecklistItem["status"] }) {
  switch (status) {
    case "accepted":
      return <span className="text-green-600">&#10003;</span>;
    case "pending":
      return <span className="text-amber-500">&#9679;</span>;
    case "more_info_needed":
      return <span className="text-red-500">!</span>;
    default:
      return <span className="text-zinc-300">&#9675;</span>;
  }
}

function StatusBadge({ status }: { status: ChecklistItem["status"] }) {
  switch (status) {
    case "accepted":
      return <Badge>Accepted</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending Review</Badge>;
    case "more_info_needed":
      return <Badge variant="destructive">More Info Needed</Badge>;
    default:
      return <Badge variant="outline">Missing</Badge>;
  }
}
