// ... imports anteriores ...
import Welcome from "@/pages/Welcome";

// Dentro do <Routes> (antes do NotFound)
<Route path="/welcome" element={
  <ProtectedRoute>
    <Welcome />
  </ProtectedRoute>
} />