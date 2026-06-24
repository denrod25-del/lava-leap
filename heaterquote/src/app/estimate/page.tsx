"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OptionPills from "@/components/OptionPills";
import { getSupabaseBrowser, PHOTO_BUCKET } from "@/lib/supabase/client";
import {
  ADD_ONS,
  calculateEstimate,
  suggestAddOns,
  derivedTanklessType,
  formatUsd,
  DISCLAIMER,
  type AddOnKey,
  type SystemType,
  type FuelType,
} from "@/lib/estimate";
import {
  SYSTEM_TYPES,
  FUEL_TYPES,
  GALLON_SIZES,
  LOCATIONS,
  CURRENT_ISSUES,
  URGENCIES,
} from "@/lib/options";

const ADD_ON_ORDER = Object.keys(ADD_ONS) as AddOnKey[];

export default function EstimatePage() {
  const router = useRouter();

  // Contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");

  // Heater
  const [currentSystem, setCurrentSystem] = useState<SystemType>("tank");
  const [systemType, setSystemType] = useState<SystemType>("tank");
  const [fuelType, setFuelType] = useState<FuelType>("gas");
  const [gallonSize, setGallonSize] = useState("40");
  const [location, setLocation] = useState("garage");
  const [currentIssue, setCurrentIssue] = useState("old");
  const [urgency, setUrgency] = useState("this_week");

  // Add-ons are auto-suggested from the answers above; `overrides` records any
  // checkbox the homeowner has explicitly flipped away from the suggestion.
  const [overrides, setOverrides] = useState<
    Partial<Record<AddOnKey, boolean>>
  >({});
  const [photos, setPhotos] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(
    () =>
      new Set(
        suggestAddOns({ location, systemType, fuelType, currentIssue, urgency })
      ),
    [location, systemType, fuelType, currentIssue, urgency]
  );

  // Effective selection: a manual override if present, else the suggestion.
  const addOns = useMemo<AddOnKey[]>(
    () =>
      ADD_ON_ORDER.filter((k) =>
        overrides[k] !== undefined ? overrides[k]! : suggested.has(k)
      ),
    [overrides, suggested]
  );

  // What this job is, derived from current vs. desired system.
  const tanklessLabel = useMemo(() => {
    const t = derivedTanklessType({ currentSystem, systemType });
    if (!t) return null;
    return t === "conversion"
      ? "Tank → tankless conversion"
      : "Tankless replacement";
  }, [currentSystem, systemType]);

  const estimate = useMemo(
    () =>
      calculateEstimate({
        currentSystem,
        systemType,
        fuelType,
        addOns,
      }),
    [currentSystem, systemType, fuelType, addOns]
  );

  function isChecked(key: AddOnKey) {
    return overrides[key] !== undefined ? overrides[key]! : suggested.has(key);
  }

  function toggleAddOn(key: AddOnKey) {
    const next = !isChecked(key);
    // If the new value matches the suggestion again, drop the override so the
    // checkbox resumes following the auto-suggestion as answers change.
    setOverrides((prev) => {
      const copy = { ...prev };
      if (next === suggested.has(key)) {
        delete copy[key];
      } else {
        copy[key] = next;
      }
      return copy;
    });
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    // Keep it reasonable for a mobile upload.
    setPhotos(files.slice(0, 8));
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return [];
    const supabase = getSupabaseBrowser();
    const urls: string[] = [];
    const stamp = Date.now();
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${stamp}-${i}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        throw new Error(`Photo upload failed: ${upErr.message}`);
      }
      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !phone || !email || !zip) {
      setError("Please fill in your name, phone, email, and ZIP code.");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrls: string[] = [];
      try {
        photoUrls = await uploadPhotos();
      } catch (photoErr) {
        // Don't block the lead on a photo failure — submit without photos.
        console.error(photoErr);
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          zip,
          current_system: currentSystem,
          system_type: systemType,
          fuel_type: fuelType,
          gallon_size: gallonSize,
          location,
          current_issue: currentIssue,
          urgency,
          add_ons: addOns,
          photo_urls: photoUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      router.push(`/results/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Free water heater estimate
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          A few quick questions and you&apos;ll see your replacement range.
        </p>
      </div>

      {/* Contact */}
      <section className="card space-y-4">
        <h2 className="text-base font-bold text-slate-900">Your contact info</h2>
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Jane Smith"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              className="field-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(305) 555-0199"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="zip">
              ZIP code
            </label>
            <input
              id="zip"
              inputMode="numeric"
              className="field-input"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              autoComplete="postal-code"
              placeholder="33101"
              maxLength={5}
            />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="jane@example.com"
          />
        </div>
      </section>

      {/* Heater details */}
      <section className="card space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          About your water heater
        </h2>

        <div>
          <span className="field-label">What do you have now?</span>
          <OptionPills
            options={SYSTEM_TYPES}
            value={currentSystem}
            onChange={(v) => setCurrentSystem(v as SystemType)}
          />
        </div>

        <div>
          <span className="field-label">What do you want installed?</span>
          <OptionPills
            options={SYSTEM_TYPES}
            value={systemType}
            onChange={(v) => setSystemType(v as SystemType)}
          />
          {tanklessLabel && (
            <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
              This looks like a {tanklessLabel.toLowerCase()}.
            </p>
          )}
        </div>

        <div>
          <span className="field-label">Gas or electric?</span>
          <OptionPills
            options={FUEL_TYPES}
            value={fuelType}
            onChange={(v) => setFuelType(v as FuelType)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="gallon">
            Gallon size
          </label>
          <select
            id="gallon"
            className="field-input"
            value={gallonSize}
            onChange={(e) => setGallonSize(e.target.value)}
          >
            {GALLON_SIZES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="field-label">Heater location</span>
          <OptionPills
            options={LOCATIONS}
            value={location}
            onChange={setLocation}
            columns={3}
          />
        </div>

        <div>
          <span className="field-label">Current issue</span>
          <OptionPills
            options={CURRENT_ISSUES}
            value={currentIssue}
            onChange={setCurrentIssue}
            columns={3}
          />
        </div>

        <div>
          <span className="field-label">How soon do you need this done?</span>
          <OptionPills
            options={URGENCIES}
            value={urgency}
            onChange={setUrgency}
            columns={3}
          />
        </div>
      </section>

      {/* Add-ons */}
      <section className="card space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Site conditions that may apply
          </h2>
          <p className="text-sm text-slate-600">
            We&apos;ve pre-checked the ones that usually apply based on your
            answers. Add or remove any — your installer confirms on site.
          </p>
        </div>
        <div className="space-y-2">
          {ADD_ON_ORDER.map((key) => {
            const def = ADD_ONS[key];
            const checked = isChecked(key);
            const isSuggested = suggested.has(key);
            return (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                  checked={checked}
                  onChange={() => toggleAddOn(key)}
                />
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {def.label}
                      </span>
                      {isSuggested && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                          Suggested
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap text-sm font-medium text-slate-500">
                      {formatUsd(def.range.low)}–{formatUsd(def.range.high)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {def.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Photos */}
      <section className="card space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Photos of your setup
          </h2>
          <p className="text-sm text-slate-600">
            Optional, but photos help us give you a more accurate range.
          </p>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50">
          <span className="text-3xl">📷</span>
          <span className="mt-2 text-sm font-semibold text-slate-700">
            Tap to add photos
          </span>
          <span className="text-xs text-slate-500">Up to 8 images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPhotoChange}
          />
        </label>
        {photos.length > 0 && (
          <ul className="space-y-1 text-sm text-slate-600">
            {photos.map((p, i) => (
              <li key={i} className="flex items-center gap-2">
                <span>🖼️</span>
                <span className="truncate">{p.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Live estimate */}
      <section className="sticky bottom-4 z-20">
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Your estimated range
          </div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">
            {formatUsd(estimate.low)} – {formatUsd(estimate.high)}
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-4 w-full"
          >
            {submitting ? "Submitting…" : "Get My Estimate"}
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {DISCLAIMER}
          </p>
        </div>
      </section>
    </form>
  );
}
