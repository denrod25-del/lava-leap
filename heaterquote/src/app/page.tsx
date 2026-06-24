import Link from "next/link";
import { DISCLAIMER } from "@/lib/estimate";

const STEPS = [
  {
    icon: "📝",
    title: "Tell us about your heater",
    body: "Tank or tankless, gas or electric, where it lives, and what's going on.",
  },
  {
    icon: "📸",
    title: "Snap a few photos",
    body: "Upload pictures of your current setup so we can sharpen the range.",
  },
  {
    icon: "💵",
    title: "See your price range",
    body: "Get an honest replacement estimate instantly — before you ever call.",
  },
];

const RANGES = [
  { label: "Electric tank", range: "$1,500 – $2,300" },
  { label: "Gas tank", range: "$1,800 – $2,800" },
  { label: "Tankless replacement", range: "$3,200 – $5,500" },
  { label: "Tankless conversion", range: "$4,500 – $8,500" },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="pt-4 text-center">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Florida homeowners
        </span>
        <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Know your water heater replacement range before you call.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-slate-600 sm:text-lg">
          No pushy sales calls. No surprise pricing. Answer a few quick
          questions and get a clear, honest estimate in under two minutes.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Link href="/estimate" className="btn-primary w-full max-w-xs">
            Start Free Estimate
          </Link>
          <span className="text-xs text-slate-500">
            Free · No obligation · Takes ~2 minutes
          </span>
        </div>
      </section>

      {/* Price ranges */}
      <section>
        <h2 className="mb-4 text-center text-lg font-bold text-slate-900">
          Typical replacement ranges
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {RANGES.map((r) => (
            <div key={r.label} className="card text-center">
              <div className="text-sm font-medium text-slate-500">
                {r.label}
              </div>
              <div className="mt-1 text-lg font-extrabold text-brand-700">
                {r.range}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Final range depends on add-ons like permits, expansion tanks, and
          access.
        </p>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-5 text-center text-lg font-bold text-slate-900">
          How it works
        </h2>
        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card flex items-start gap-4">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
                {s.icon}
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {i + 1}. {s.title}
                </div>
                <div className="text-sm text-slate-600">{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-brand-600 px-6 py-8 text-center text-white">
        <h2 className="text-xl font-bold">Ready for your number?</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-brand-100">
          Get your personalized replacement range now.
        </p>
        <Link
          href="/estimate"
          className="mt-5 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
        >
          Start Free Estimate
        </Link>
      </section>

      <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-xs leading-relaxed text-slate-500">
        {DISCLAIMER}
      </p>
    </div>
  );
}
