// ...
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, role")
    .eq("id", nextSession.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Auth state profile error:", profileError);
  }
  // ...