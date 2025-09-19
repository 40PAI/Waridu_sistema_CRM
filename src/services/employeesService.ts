import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/components/employees/EmployeeDialog";

export const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from("employees")
    .select(`
      id,
      name,
      role,
      email,
      status,
      cost_per_day,
      technician_category,
      user_id,
      avatar,
      avatar_url
    `)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};

export const upsertEmployee = async (payload: Partial<Employee>) => {
  if (payload.id) {
    const { data, error } = await supabase
      .from("employees")
      .update({
        name: payload.name,
        role: payload.role,
        email: payload.email,
        status: payload.status,
        technician_category: (payload as any).technicianCategoryId ?? null,
        user_id: (payload as any).userId ?? null,
      })
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("employees")
      .insert({
        name: payload.name,
        role: payload.role,
        email: payload.email,
        status: payload.status,
        technician_category: (payload as any).technicianCategoryId ?? null,
        user_id: (payload as any).userId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};