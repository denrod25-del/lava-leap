import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card text-center">
      <span className="text-4xl">🔍</span>
      <h1 className="mt-2 text-xl font-bold text-slate-900">
        Estimate not found
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        We couldn&apos;t find that estimate. It may have expired or the link is
        incorrect.
      </p>
      <Link href="/estimate" className="btn-primary mt-5">
        Start a new estimate
      </Link>
    </div>
  );
}
