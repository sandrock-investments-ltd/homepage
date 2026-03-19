"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import {
  RENTER_DOCUMENT_CATEGORIES,
  ALL_DOCUMENT_CATEGORIES,
} from "@/lib/constants";
import type { Database } from "@/types/database";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type Tenancy = Database["public"]["Tables"]["tenancies"]["Row"];

export default function MyDocumentsPage() {
  return (
    <AuthGuard requiredRole="renter">
      <DashboardShell>
        <DocumentsContent />
      </DashboardShell>
    </AuthGuard>
  );
}

function DocumentsContent() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: tenancies } = await supabase
      .from("tenancies")
      .select("*")
      .eq("renter_id", user.id)
      .limit(1);

    const t = tenancies?.[0] ?? null;
    setTenancy(t);

    if (t) {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("tenancy_id", t.id)
        .order("created_at", { ascending: false });
      setDocuments(docs ?? []);
    }

    setLoading(false);
  }, [user]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount, standard pattern
  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleUpload() {
    if (!selectedFile || !selectedCategory || !tenancy || !user) return;
    setUploading(true);

    // Find if there's an existing doc in this category to link as parent
    const existing = documents.find(
      (d) =>
        d.category === selectedCategory && d.uploaded_by === user.id && !documents.some((child) => child.parent_document_id === d.id)
    );

    const docId = crypto.randomUUID();
    const storagePath = `${tenancy.id}/${docId}_${selectedFile.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("sandrock-documents")
      .upload(storagePath, selectedFile);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Create document record
    const { error: insertError } = await supabase.from("documents").insert({
      id: docId,
      tenancy_id: tenancy.id,
      uploaded_by: user.id,
      category: selectedCategory,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      mime_type: selectedFile.type,
      storage_path: storagePath,
      version: existing ? existing.version + 1 : 1,
      parent_document_id: existing?.id ?? null,
    });

    if (insertError) {
      alert("Failed to save document record: " + insertError.message);
      setUploading(false);
      return;
    }

    setSelectedFile(null);
    setSelectedCategory("");
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    setUploading(false);
    fetchData();
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

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  if (!tenancy) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Documents</h1>
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">
              You don&apos;t have an active tenancy yet. Your landlord needs to
              set one up for you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group docs by category, showing latest version only
  const latestByCategory = documents.reduce<Record<string, Document>>(
    (acc, doc) => {
      if (!acc[doc.category] || doc.version > acc[doc.category].version) {
        acc[doc.category] = doc;
      }
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">My Documents</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Upload your identity and financial documents
      </p>

      {/* Upload section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload a Document</CardTitle>
          <CardDescription>
            Select a category and choose a file (PDF, JPG, or PNG, max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Select category...</option>
                {RENTER_DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCategory || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents list */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-zinc-900">
          Uploaded Documents
        </h3>
        {documents.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {Object.values(latestByCategory).map((doc) => {
              const versions = documents.filter(
                (d) => d.category === doc.category
              );
              return (
                <Card key={doc.id}>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {doc.file_name}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {getCategoryLabel(doc.category)} &middot; v
                          {doc.version} &middot;{" "}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ReviewBadge status={doc.review_status} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDocument(doc.storage_path)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                    {doc.review_note && (
                      <p className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1">
                        Landlord note: {doc.review_note}
                      </p>
                    )}
                    {versions.length > 1 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700">
                          Version history ({versions.length} versions)
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                          {versions
                            .sort((a, b) => b.version - a.version)
                            .map((v) => (
                              <div
                                key={v.id}
                                className="flex items-center justify-between"
                              >
                                <span className="text-zinc-500">
                                  v{v.version} — {v.file_name} —{" "}
                                  {new Date(v.created_at).toLocaleDateString()}
                                </span>
                                <Button
                                  variant="link"
                                  size="xs"
                                  onClick={() => viewDocument(v.storage_path)}
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewBadge({ status }: { status: string }) {
  switch (status) {
    case "accepted":
      return <Badge>Accepted</Badge>;
    case "more_info_needed":
      return <Badge variant="destructive">More Info Needed</Badge>;
    default:
      return <Badge variant="secondary">Pending Review</Badge>;
  }
}
