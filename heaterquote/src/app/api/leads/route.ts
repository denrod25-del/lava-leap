import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { calculateEstimate, ADD_ONS, type AddOnKey } from "@/lib/estimate";
import type { LeadSubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

const VALID_ADD_ONS = new Set(Object.keys(ADD_ONS));

export async function POST(request: Request) {
  let body: LeadSubmission;
  try {
    body = (await request.json()) as LeadSubmission;
  } catch {
    return bad("Invalid JSON body.");
  }

  // Required fields
  const required: (keyof LeadSubmission)[] = [
    "name",
    "phone",
    "email",
    "zip",
    "system_type",
    "fuel_type",
    "gallon_size",
    "location",
    "current_issue",
    "urgency",
  ];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return bad(`Missing required field: ${field}`);
    }
  }

  if (body.system_type !== "tank" && body.system_type !== "tankless") {
    return bad("system_type must be 'tank' or 'tankless'.");
  }
  if (body.fuel_type !== "gas" && body.fuel_type !== "electric") {
    return bad("fuel_type must be 'gas' or 'electric'.");
  }

  const addOns: AddOnKey[] = Array.isArray(body.add_ons)
    ? (body.add_ons.filter((a) => VALID_ADD_ONS.has(a)) as AddOnKey[])
    : [];

  const photoUrls: string[] = Array.isArray(body.photo_urls)
    ? body.photo_urls.filter((u) => typeof u === "string")
    : [];

  // Compute the estimate server-side so it can't be tampered with by the client.
  const estimate = calculateEstimate({
    systemType: body.system_type,
    tanklessType: body.tankless_type ?? null,
    fuelType: body.fuel_type,
    addOns,
  });

  const row = {
    name: String(body.name).trim(),
    phone: String(body.phone).trim(),
    email: String(body.email).trim(),
    zip: String(body.zip).trim(),
    system_type: body.system_type,
    tankless_type:
      body.system_type === "tankless" ? body.tankless_type ?? null : null,
    fuel_type: body.fuel_type,
    gallon_size: String(body.gallon_size),
    location: String(body.location),
    current_issue: String(body.current_issue),
    urgency: String(body.urgency),
    add_ons: addOns,
    estimate_low: estimate.low,
    estimate_high: estimate.high,
    photo_urls: photoUrls,
    status: "new",
  };

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return bad(
      err instanceof Error ? err.message : "Supabase is not configured.",
      500
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return bad(`Could not save lead: ${error.message}`, 500);
  }

  return NextResponse.json({
    id: data.id,
    estimate_low: estimate.low,
    estimate_high: estimate.high,
  });
}
