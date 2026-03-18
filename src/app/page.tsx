import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Sandrock Investments Limited
        </h1>
        <p className="mt-4 text-lg text-zinc-600">Renter Portal</p>
        <div className="mt-8">
          <Link
            href="/renter/documents"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Go to My Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
