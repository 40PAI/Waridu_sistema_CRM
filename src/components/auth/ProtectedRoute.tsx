// ... no topo do componente ...

if (!session || !user) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}

// Bloquear usuários sem role
if (!user.profile?.role) {
  return <Navigate to="/welcome" replace />;
}

// ... resto do código ...