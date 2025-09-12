// ...
  let technician_category_id: string | null = null;
  if (profileData?.role === 'Técnico') {
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('technician_category')
      .eq('user_id', nextSession.user.id)
      .maybeSingle();
    if (empError) {
      console.error("Auth state employee error:", empError);
    } else {
      technician_category_id = empData?.technician_category || null;
    }
  }
  // ...