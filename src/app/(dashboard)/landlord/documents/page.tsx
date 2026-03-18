"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { ALL_DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { Database } from "@/types/database";

type Document = Database["public"]["Tables"]["documents"]["Row"];

export default function LandlordDocumentsPage() {
  return (
    <AuthGuard requiredRole="landlord">
      <DashboardShell>
        <DocumentsContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function DocumentsContent() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function fetchDocuments() {
    if (!user) return;

    // Get all properties owned by landlord
    const { data: properties } = await supabase
      .from("properties")
      .select("id")
      .eq("landlord_id", user.id);

    if (!properties?.length) {
      setLoading(false);
      return;
    }

    // Get tenancies for those properties
    const { data: tenancies } = await supabase
      .from("tenancies")
      .select("id, renter_id")
      .in("property_id", properties.map((p) => p.id));

    if (!tenancies?.length) {
      setLoading(false);
      return;
    }

    // Get documents for those tenancies
    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .in("tenancy_id", tenancies.map((t) => t.id))
      .order("created_at", { ascending: false });

    // Get uploader names
    const uploaderIds = [...new Set(docs?.map((d) => d.uploaded_by) ?? [])];
    if (uploaderIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uploaderIds);
      setProfiles(
        Object.fromEntries(profs?.map((p) => [p.id, p.full_name]) ?? [])
      );
    }

    setDocuments(docs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function reviewDocument(
    docId: string,
    status: "accepted" | "more_info_needed",
    note: string
  ) {
    await supabase
      .from("documents")
      .update({
        review_status: status,
        review_note: note || null,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", docId);
    fetchDocuments();
  }

  async function viewDocument(storagePath: string) {
    const { data } = await supabase.storage
      .from("sandrock-documents")
      .createSignedUrl(storagePath, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  const getCategoryLabel = (value: string) =>
    ALL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Documents</h1>
      <p className="text-sm text-zinc-500">
        Review documents uploaded by your tenants
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading...</p>
      ) : documents.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">No documents to review yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              uploaderName={profiles[doc.uploaded_by] ?? "Unknown"}
              categoryLabel={getCategoryLabel(doc.category)}
              onReview={reviewDocument}
              onView={viewDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  uploaderName,
  categoryLabel,
  onReview,
  onView,
}: {
  doc: Document;
  uploaderName: string;
  categoryLabel: string;
  onReview: (id: string, status: "accepted" | "more_info_needed", note: string) => void;
  onView: (path: string) => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [showReview, setShowReview] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-zinc-900">{doc.file_name}</p>
            <p className="text-sm text-zinc-500">
              {categoryLabel} &middot; v{doc.version} &middot; Uploaded by{" "}
              {uploaderName} &middot;{" "}
              {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReviewBadge status={doc.review_status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(doc.storage_path)}
            >
              View
            </Button>
          </div>
        </div>

        {doc.review_status === "pending" && !showReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReview(true)}
          >
            Review
          </Button>
        )}

        {showReview && (
          <div className="space-y-3 rounded-md border p-3">
            <Textarea
              placeholder="Add a note (optional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onReview(doc.id, "accepted", reviewNote);
                  setShowReview(false);
                }}
              >
                Accept
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onReview(doc.id, "more_info_needed", reviewNote);
                  setShowReview(false);
                }}
              >
                Request More Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReview(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {doc.review_note && (
          <p className="text-sm text-zinc-500">
            Review note: {doc.review_note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewBadge({ status }: { status: string }) {
  switch (status) {
    case "accepted":
      return <Badge>Accepted</Badge>;
    case "more_info_needed":
      return <Badge variant="destructive">More Info Needed</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}
