"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOCUMENT_CATEGORIES = [
  { value: "passport", label: "Passport" },
  { value: "driving-licence", label: "Driving Licence" },
  { value: "proof-of-address", label: "Proof of Address" },
  { value: "payslip", label: "Payslip" },
  { value: "employment-contract", label: "Employment Contract" },
  { value: "visa-brp", label: "Visa / BRP" },
] as const;

type Document = {
  id: string;
  fileName: string;
  category: string;
  uploadedAt: Date;
  status: "pending" | "accepted" | "more-info-needed";
};

export default function RenterDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleUpload() {
    if (!selectedFile || !selectedCategory) return;

    const categoryLabel =
      DOCUMENT_CATEGORIES.find((c) => c.value === selectedCategory)?.label ??
      selectedCategory;

    const newDoc: Document = {
      id: crypto.randomUUID(),
      fileName: selectedFile.name,
      category: categoryLabel,
      uploadedAt: new Date(),
      status: "pending",
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedFile(null);
    setSelectedCategory("");

    // Reset the file input
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Sandrock Investments Limited
            </h1>
            <p className="text-sm text-zinc-500">Renter Portal</p>
          </div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h2 className="text-2xl font-bold text-zinc-900">My Documents</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload your identity and financial documents for your tenancy
          application.
        </p>

        {/* Upload section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upload a Document</CardTitle>
            <CardDescription>
              Select a category and choose a file to upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Category
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={!selectedFile || !selectedCategory}
              >
                Upload
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
              No documents uploaded yet. Use the form above to get started.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {doc.fileName}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {doc.category} &middot;{" "}
                        {doc.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: Document["status"] }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending Review</Badge>;
    case "accepted":
      return <Badge variant="default">Accepted</Badge>;
    case "more-info-needed":
      return <Badge variant="destructive">More Info Needed</Badge>;
  }
}
