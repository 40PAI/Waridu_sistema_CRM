// ... (código anterior permanece o mesmo)

  // Convidar membro via Edge Function
  const inviteMember = async (email: string, roleId: string) => {
    // Busca o nome da função com base no ID
    const roleName = roles.find(r => r.id === roleId)?.name || "Técnico";
    
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    // Log para debug
    console.log("Enviando convite com:", { email, roleId, roleName });

    const { data, error } = await supabase.functions.invoke(
      "invite-member", // Usar apenas o nome da função
      {
        body: { email, roleId, roleName }, // Envia roleName explicitamente
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (error) {
      console.error("Erro na função invite-member:", error);
      return { ok: false as const, error: error.message || "Falha ao enviar convite" };
    }

    console.log("Resposta da função invite-member:", data);
    return { ok: true as const };
  };

// ... (restante do código permanece o mesmo)