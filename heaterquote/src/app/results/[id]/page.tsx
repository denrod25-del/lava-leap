import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  calculateEstimate,
  formatUsd,
  DISCLAIMER,
  type AddOnKey,
} from "@/lib/estimate";
import { labelFor, URGENCIES, CURRENT_ISSUES, LOCATIONS } from "@/lib/options";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="card text-center">
        <p className="text-slate-700">
          Supabase isn&apos;t configured yet. Add your keys to{" "}
          <code>.env.local</code> to see saved estimates.
        </p>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const lead = data as Lead;
  const estimate = calculateEstimate({
    systemType: lead.system_type,
    tanklessType: lead.tankless_type,
    fuelType: lead.fuel_type,
    addOns: (lead.add_ons || []) as AddOnKey[],
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-4xl">✅</span>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          Here&apos;s your estimate, {lead.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          We&apos;ve saved your details. A local pro can confirm exact pricing.
        </p>
      </div>

      {/* Headline range */}
      <div className="rounded-2xl bg-brand-600 px-6 py-8 text-center text-white">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-100">
          Estimated replacement range
        </div>
        <div className="mt-2 text-4xl font-extrabold sm:text-5xl">
          {formatUsd(estimate.low)} – {formatUsd(estimate.high)}
        </div>
      </div>

      {/* Breakdown */}
      <section className="card">
        <h2 className="mb-3 text-base font-bold text-slate-900">
          What&apos;s in this range
        </h2>
        <ul className="divide-y divide-slate-100">
          {estimate.lineItems.map((li) => (
            <li
              key={li.key}
              className="flex items-center justify-between py-2.5"
            >
              <span className="text-sm text-slate-700">{li.label}</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatUsd(li.range.low)} – {formatUsd(li.range.high)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="font-bold text-slate-900">Total range</span>
          <span className="font-extrabold text-brand-700">
            {formatUsd(estimate.low)} – {formatUsd(estimate.high)}
          </span>
        </div>
      </section>

      {/* Summary of inputs */}
      <section className="card">
        <h2 className="mb-3 text-base font-bold text-slate-900">
          Your heater details
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <SummaryItem label="System">
            {lead.system_type === "tankless" ? "Tankless" : "Tank"}
            {lead.tankless_type ? ` (${lead.tankless_type})` : ""}
          </SummaryItem>
          <SummaryItem label="Fuel">
            {lead.fuel_type === "gas" ? "Gas" : "Electric"}
          </SummaryItem>
          <SummaryItem label="Size">{lead.gallon_size} gal</SummaryItem>
          <SummaryItem label="Location">
            {labelFor(LOCATIONS, lead.location)}
          </SummaryItem>
          <SummaryItem label="Issue">
            {labelFor(CURRENT_ISSUES, lead.current_issue)}
          </SummaryItem>
          <SummaryItem label="Timeline">
            {labelFor(URGENCIES, lead.urgency)}
          </SummaryItem>
        </dl>
      </section>

      {/* Photos */}
      {lead.photo_urls && lead.photo_urls.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-base font-bold text-slate-900">
            Your photos
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {lead.photo_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={`Heater photo ${i + 1}`}
                  className="aspect-square w-full rounded-xl border border-slate-200 object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <a href="tel:" className="btn-primary flex-1">
          Talk to a pro
        </a>
        <Link href="/estimate" className="btn-secondary flex-1">
          Start over
        </Link>
      </div>

      <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-xs leading-relaxed text-slate-500">
        {DISCLAIMER}
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{children}</dd>
    </div>
  );
}
