import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatUsd, ADD_ONS, type AddOnKey } from "@/lib/estimate";
import {
  labelFor,
  LOCATIONS,
  CURRENT_ISSUES,
  URGENCIES,
  GALLON_SIZES,
} from "@/lib/options";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

const COOKIE = "hq_admin";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD;
  if (expected && password === expected) {
    cookies().set(COOKIE, password, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  redirect("/admin");
}

async function logout() {
  "use server";
  cookies().delete(COOKIE);
  redirect("/admin");
}

function isAuthed(): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return cookies().get(COOKIE)?.value === expected;
}

export default async function AdminPage() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <div className="card text-center text-slate-700">
        Set <code>ADMIN_PASSWORD</code> in your environment to enable the admin
        dashboard.
      </div>
    );
  }

  if (!isAuthed()) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="card space-y-4">
          <h1 className="text-xl font-extrabold text-slate-900">Admin login</h1>
          <p className="text-sm text-slate-600">
            Enter the admin password to view leads.
          </p>
          <form action={login} className="space-y-3">
            <input
              type="password"
              name="password"
              className="field-input"
              placeholder="Password"
              autoFocus
            />
            <button type="submit" className="btn-primary w-full">
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="card text-center text-slate-700">
        Supabase isn&apos;t configured. Add your keys to view leads.
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data || []) as Lead[];

  const totalValue = leads.reduce(
    (acc, l) => {
      acc.low += l.estimate_low;
      acc.high += l.estimate_high;
      return acc;
    },
    { low: 0, high: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Leads
          </h1>
          <p className="text-sm text-slate-600">
            {leads.length} total · pipeline {formatUsd(totalValue.low)}–
            {formatUsd(totalValue.high)}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            Sign out
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load leads: {error.message}
        </div>
      )}

      {leads.length === 0 && !error && (
        <div className="card text-center text-slate-600">
          No leads yet. Estimates submitted from the form will appear here.
        </div>
      )}

      <div className="space-y-4">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const created = new Date(lead.created_at);
  const urgent = lead.urgency === "today";

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
            {urgent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Today
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {created.toLocaleString("en-US")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Estimate
          </div>
          <div className="font-extrabold text-brand-700">
            {formatUsd(lead.estimate_low)}–{formatUsd(lead.estimate_high)}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a
          href={`tel:${lead.phone}`}
          className="font-medium text-brand-700 hover:underline"
        >
          📞 {lead.phone}
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="font-medium text-brand-700 hover:underline"
        >
          ✉️ {lead.email}
        </a>
        <span className="text-slate-600">📍 {lead.zip}</span>
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag>
          {lead.system_type === "tankless" ? "Tankless" : "Tank"}
          {lead.tankless_type ? ` · ${lead.tankless_type}` : ""}
        </Tag>
        <Tag>{lead.fuel_type === "gas" ? "Gas" : "Electric"}</Tag>
        <Tag>{labelFor(GALLON_SIZES, lead.gallon_size)}</Tag>
        <Tag>{labelFor(LOCATIONS, lead.location)}</Tag>
        <Tag>{labelFor(CURRENT_ISSUES, lead.current_issue)}</Tag>
        <Tag>{labelFor(URGENCIES, lead.urgency)}</Tag>
      </div>

      {/* Add-ons */}
      {lead.add_ons && lead.add_ons.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          Add-ons:{" "}
          {lead.add_ons
            .map((a) => ADD_ONS[a as AddOnKey]?.label ?? a)
            .join(", ")}
        </div>
      )}

      {/* Photos */}
      {lead.photo_urls && lead.photo_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {lead.photo_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt={`Lead photo ${i + 1}`}
                className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
