import { supabase } from "@/integrations/supabase/client";
import type { Roster, Expense } from "@/types";

/**
 * Minimal events service used by hooks/components.
 * - fetchEvents(): returns rows from events table
 * - upsertEvent(payload): insert or update an event row (payload should use snake_case keys)
 * - updateEventDetails(eventId, details): update roster/expenses for an event
 *
 * Important security note:
 * - Clients MUST NOT send `updated_at` or `created_at`. The database trigger manages updated_at.
 * - This module sanitizes payloads to strip those fields before calling Supabase.
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
  "notes",
  "tags",
  "pipeline_stage_id",
  "responsible_id",
]);

function sanitizePayload(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (!ALLOWED_COLUMNS.has(k)) return;
    if (v === undefined) return;
    out[k] = v;
  });

  if ("updated_at" in out) delete out.updated_at;
  if ("created_at" in out) delete out.created_at;

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

  if (sanitized.pipeline_stage_id !== undefined && sanitized.pipeline_stage_id !== null && !isUuid(sanitized.pipeline_stage_id)) {
    invalids.push(`pipeline_stage_id="${String(sanitized.pipeline_stage_id)}"`);
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
    const sanitized = sanitizePayload(payload);
    validateUuidFields(sanitized);

    if (payload?.id) {
      const { id, ...rest } = sanitized;
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
    const message = err?.message || String(err) || "Unknown error in upsertEvent";
    throw new Error(message);
  }
};

export const updateEventDetails = async (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
  const payload: any = {
    roster: details.roster ?? null,
    expenses: details.expenses ?? null,
  };

  try {
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