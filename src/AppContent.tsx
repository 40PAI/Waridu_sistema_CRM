// ... (imports existentes)

   import AuthCallback from "@/pages/AuthCallback";
   import Welcome from "@/pages/Welcome";

   // ... (código existente)

   <Routes>
     <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
     <Route path="/auth/callback" element={<AuthCallback />} />
     <Route path="/welcome" element={<Welcome />} />
     <Route path="/health-check" element={<HealthCheck />} />
     <Route path="/debug" element={<Debug />} />

     <Route element={<ProtectedRoute />}>
       // ... (rotas existentes)
     </Route>

     <Route path="*" element={<NotFound />} />
   </Routes>

   // ... (resto do código permanece igual)