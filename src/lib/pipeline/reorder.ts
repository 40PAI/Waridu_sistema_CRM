import { supabase } from "@/integrations/supabase/client";

/**
 * Build updates list from array of ids and status.
 * Each update will include { id, pipeline_status, pipeline_position }.
 */
export function buildPositionUpdates(ids: string[], status: string) {
  return ids.map((id, idx) => ({
    id,
    pipeline_status: status,
    pipeline_position: idx,
  }));
}

/**
 * Sanitize object to ensure we do not send client-managed timestamps.
 */
function sanitizeRow<T extends Record<string, any>>(row: T): T {
  const clone = { ...row };
  delete (clone as any).created_at;
  delete (clone as any).updated_at;
  return clone;
}

/**
 * Persist updates in chunks to avoid huge payloads.
 * Uses upsert on events table (onConflict by id).
 */
export async function persistPositions(
  updates: { id: string; pipeline_status: string; pipeline_position: number }[],
  chunkSize = 50
) {
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize).map(sanitizeRow);
    const { error } = await supabase
      .from("events")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error("persistPositions chunk error:", error, { chunk });
      throw error;
    }
  }
}

/**
 * Compute and persist new ordering when a task/event is moved.
 *
 * - allItems: full array of items (each must have id and pipeline_status and pipeline_position)
 * - activeId: dragged id
 * - overId: id that was targeted (could be a column id or another item id)
 * - isColumnId: fn(id) => boolean, identifies column containers
 * - resolveTargetStatus: fn(overId) => status string (column id or target's status)
 *
 * This function only persists position/status changes; it does NOT mutate local UI state.
 */
export async function handleReorder(params: {
  allItems: Array<{ id: string; pipeline_status?: string; pipeline_position?: number }>;
  activeId: string;
  overId: string;
  isColumnId: (id: string) => boolean;
  resolveTargetStatus: (id: string) => string | null;
}) {
  const { allItems, activeId, overId, isColumnId, resolveTargetStatus } = params;

  const active = allItems.find((it) => it.id === activeId);
  if (!active) {
    throw new Error("Active item not found");
  }

  const from = active.pipeline_status || "";
  const to = resolveTargetStatus(overId);
  if (!to) {
    throw new Error("Could not resolve target status");
  }

  // Build lists for from/to sorted by pipeline_position (fallback to 0)
  const fromList = allItems
    .filter((t) => (t.pipeline_status || "") === from)
    .slice()
    .sort((a, b) => (Number(a.pipeline_position) || 0) - (Number(b.pipeline_position) || 0));

  const toList =
    from === to
      ? fromList
      : allItems
          .filter((t) => (t.pipeline_status || "") === to)
          .slice()
          .sort((a, b) => (Number(a.pipeline_position) || 0) - (Number(b.pipeline_position) || 0));

  const oldIndex = fromList.findIndex((t) => t.id === activeId);
  // target index within toList:
  const overIndex = isColumnId(overId) ? -1 : toList.findIndex((t) => t.id === overId);
  const newIndex = overIndex === -1 ? toList.length : overIndex;

  // If moving between different columns
  if (from !== to) {
    // Remove from old
    const fromIds = fromList.map((t) => t.id).filter((id) => id !== activeId);

    // Build new to ids with active inserted at newIndex
    const toIds = toList.map((t) => t.id);
    const idxToInsert = Math.max(0, Math.min(newIndex, toIds.length));
    toIds.splice(idxToInsert, 0, activeId);

    const updates = [...buildPositionUpdates(fromIds, from), ...buildPositionUpdates(toIds, to)];
    await persistPositions(updates);
    return;
  }

  // Same column reorder
  if (oldIndex === -1) {
    // item not in from list? nothing to do
    return;
  }

  // No-op if index unchanged
  if (oldIndex === newIndex) return;

  // Build ordered ids and persist
  const ids = fromList.map((t) => t.id);
  // remove active
  ids.splice(oldIndex, 1);
  // compute target insert index within same list (if newIndex refers to item index in same list, adjust)
  const insertIndex = Math.max(0, Math.min(newIndex, ids.length));
  ids.splice(insertIndex, 0, activeId);

  const updates = buildPositionUpdates(ids, from);
  await persistPositions(updates);
}