// ... dentro do useEffect de onAuthStateChange ...

if (nextSession?.user) {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, role")
    .eq("id", nextSession.user.id)
    .single();

  if (profileError) {
    console.error("Auth state profile error:", profileError);
  }

  // Se não tem role, redireciona para welcome
  if (!profileData?.role) {
    navigate("/welcome");
    setUser({ ...nextSession.user, profile: null });
    return;
  }

  // ... resto do código ...
}