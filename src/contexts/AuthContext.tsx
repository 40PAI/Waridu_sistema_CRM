// Dentro do useEffect, após setUser e redirecionamento para /welcome:

   if (normalized && currentSession.user.user_metadata?.role) {
     // Enviar notificação de boas-vindas
     await supabase.from('notifications').insert({
       title: "Bem-vindo ao Sistema!",
       description: `Sua conta foi ativada com role ${normalized.role}. Acesse seu dashboard para começar.`,
       type: 'system',
       user_id: currentSession.user.id,
       read: false,
       created_at: new Date().toISOString(),
     });
     window.location.href = '/welcome';
   }

   // Mesmo para onAuthStateChange