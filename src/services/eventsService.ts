import { supabase } from "@/integrations/supabase/client";
import type { Roster, Expense } from "@/types";

/**
 * Minimal events service used by hooks/components.
 * - fetchEvents(): returns rows from events table
 * - upsertEvent(payload): insert or update an event row (payload should use snake_case keys)
 * - updateEventDetails(eventId, details): update roster/expenses for an event
 *
 * This implementation sanitizes payloads to only include allowed columns (avoids 400 from PostgREST
 * when unknown columns are present), strips undefined values and validates UUID fields to provide
 * clearer error messages before calling Supabase.
 */

const ALLOWED_COLUMNS = new Set([
  "name",
  "start_date",
  "end_date",
  "location",
  "start_time",
  "end_time",
  "revenue",
  "status",
  "description",
  "roster",
  "expenses",
  "client_id",
  "pipeline_status",
  "estimated_value",
  "service_ids",
  "created_at",
  // removed 'updated_at' to avoid PostgREST PGRST204 when column missing in DB
  "notes",
  "tags",
]);

function sanitizePayload(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (!ALLOWED_COLUMNS.has(k)) return;
    // strip undefined values (PostgREST can reject unexpected types)
    if (v === undefined) return;
    out[k] = v;
  });
  return out;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown) {
  return typeof v === "string" && UUID_REGEX.test(v);
}

/**
 * Validate UUID fields in payload. Throws an Error with actionable message if invalid.
 */
function validateUuidFields(sanitized: Record<string, any>) {
  const invalids: string[] = [];

  if (sanitized.client_id !== undefined && sanitized.client_id !== null && !isUuid(sanitized.client_id)) {
    invalids.push(`client_id="${String(sanitized.client_id)}"`);
  }

  if (sanitized.service_ids !== undefined && sanitized.service_ids !== null) {
    if (!Array.isArray(sanitized.service_ids)) {
      invalids.push(`service_ids is not an array`);
    } else {
      const bad = sanitized.service_ids.filter((id: any) => !isUuid(id));
      if (bad.length > 0) {
        invalids.push(`service_ids invalid entries: [${bad.map(String).join(", ")}]`);
      }
    }
  }

  if (invalids.length > 0) {
    throw new Error(`Invalid UUID fields in payload: ${invalids.join("; ")}`);
  }
}

/**
 * Ensure values are safe for JSON/DB:
 * - Convert Date objects to ISO strings
 * - Ensure service_ids is an array of strings
 * - Ensure roster/expenses are JSON-serializable
 */
function normalizeAndValidateTypes(sanitized: Record<string, any>) {
  for (const [k, v] of Object.entries(sanitized)) {
    // convert Date objects
    if (v instanceof Date) {
      sanitized[k] = v.toISOString();
      continue;
    }

    // service_ids must be array of strings
    if (k === "service_ids") {
      if (v === null) continue;
      if (!Array.isArray(v)) {
        throw new Error("service_ids must be an array of string IDs (UUIDs)");
      }
      sanitized[k] = v.map((x: any) => {
        if (x instanceof Date) return x.toISOString();
        return String(x);
      });
      continue;
    }

    // roster and expenses must be JSON serializable
    if (k === "roster" || k === "expenses") {
      try {
        // quick check — will throw on circular structures
        JSON.stringify(v);
      } catch (err) {
        throw new Error(`${k} must be JSON-serializable`);
      }
      continue;
    }

    // primitive expected types check (best-effort)
    if (k === "name" || k === "location" || k === "status" || k === "description" || k === "pipeline_status" || k === "notes") {
      if (v !== null && typeof v !== "string") {
        sanitized[k] = String(v);
      }
    }

    if (k === "estimated_value" || k === "revenue") {
      if (v === null) continue;
      if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        if (Number.isNaN(n)) throw new Error(`${k} must be numeric`);
        sanitized[k] = n;
      } else if (typeof v !== "number") {
        throw new Error(`${k} must be numeric`);
      }
    }

    // start_date / end_date / start_time / end_time should be strings (ISO/date/time)
    if ((k === "start_date" || k === "end_date" || k === "start_time" || k === "end_time") && v != null) {
      if (typeof v !== "string") {
        sanitized[k] = String(v);
      }
    }
  }
}

export const fetchEvents = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const upsertEvent = async (payload: any): Promise<any> => {
  try {
    // Clone and sanitize payload: only allowed columns and no undefined values
    const sanitized = sanitizePayload(payload);

    // Validate UUID fields before making the request to Supabase.
    // This provides an early, clear error instead of a generic 400 from PostgREST.
    validateUuidFields(sanitized);

    // Normalize types (dates -> ISO, arrays -> strings, JSON serializability checks)
    normalizeAndValidateTypes(sanitized);

    // If updating, ensure we have keys to update
    if (payload?.id) {
      // When updating, don't include id in set payload
      const { id, ...rest } = sanitized;
      const keys = Object.keys(rest);
      if (keys.length === 0) {
        throw new Error("No updatable columns provided for event update");
      }

      const { data, error } = await supabase
        .from("events")
        .update(rest)
        .eq("id", payload.id)
        .select()
        .single();

      if (error) {
        const msg = `Supabase update error: ${error.message || "unknown"}${error.details ? " — " + error.details : ""}`;
        console.error(msg, { error, payload, sanitized: rest });
        throw new Error(msg);
      }
      return data;
    } else {
      // For inserts, require at least name and start_date (common required fields)
      if (!sanitized.name || !sanitized.start_date) {
        throw new Error("Missing required fields for creating event: 'name' and 'start_date' are required");
      }

      const { data, error } = await supabase
        .from("events")
        .insert(sanitized)
        .select()
        .single();

      if (error) {
        const msg = `Supabase insert error: ${error.message || "unknown"}${error.details ? " — " + error.details : ""}`;
        console.error(msg, { error, payload, sanitized });
        throw new Error(msg);
      }
      return data;
    }
  } catch (err: any) {
    // Bubble a helpful error message
    const message = err?.message || String(err) || "Unknown error in upsertEvent";
    throw new Error(message);
  }
};

export const updateEventDetails = async (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
  const payload: any = {
    roster: details.roster ?? null,
    expenses: details.expenses ?? null,
    // removed updated_at to avoid schema mismatch with tables that don't have it
  };

  try {
    // Validate roster/expenses serializability
    try {
      JSON.stringify(payload.roster);
      JSON.stringify(payload.expenses);
    } catch {
      throw new Error("roster and expenses must be JSON-serializable");
    }

    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      const msg = `Supabase updateEventDetails error: ${error.message || "unknown"}${error.details ? " — " + error.details : ""}`;
      console.error(msg, { error, eventId, payload });
      throw new Error(msg);
    }
    return data;
  } catch (err: any) {
    const message = err?.message || String(err) || "Unknown error in updateEventDetails";
    throw new Error(message);
  }
};

export default {
  fetchEvents,
  upsertEvent,
  updateEventDetails,
};