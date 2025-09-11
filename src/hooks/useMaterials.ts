const addInitialStock = async (materialId: string, locationId: string, quantity: number) => {
    try {
      console.log("addInitialStock called with:", { materialId, locationId, quantity });

      // Validate inputs
      if (!materialId || typeof materialId !== 'string' || materialId.trim() === '') {
        showError("ID do material inválido.");
        return;
      }
      if (!locationId || typeof locationId !== 'string' || locationId.trim() === '') {
        showError("ID da localização inválido.");
        return;
      }
      if (quantity <= 0 || !Number.isInteger(quantity)) {
        showError("Quantidade deve ser um número inteiro positivo.");
        return;
      }

      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        showError("Erro de sessão. Tente novamente.");
        return;
      }
      if (!session) {
        showError("Sessão expirada. Faça login novamente.");
        return;
      }

      console.log("Session valid, proceeding with database operations");

      // Check if entry already exists
      console.log("Checking existing entry for material:", materialId, "location:", locationId);
      const { data: existing, error: checkError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', locationId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing entry:", checkError);
        throw checkError;
      }

      console.log("Existing entry:", existing);

      const currentQuantity = existing?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      console.log("Current quantity:", currentQuantity, "New quantity:", newQuantity);

      if (existing) {
        // Update existing
        console.log("Updating existing entry");
        const { error } = await supabase
          .from('material_locations')
          .update({ quantity: newQuantity })
          .eq('material_id', materialId)
          .eq('location_id', locationId);

        if (error) {
          console.error("Error updating entry:", error);
          throw error;
        }
      } else {
        // Insert new
        console.log("Inserting new entry");
        const { error } = await supabase
          .from('material_locations')
          .insert({
            material_id: materialId,
            location_id: locationId,
            quantity: newQuantity
          });

        if (error) {
          console.error("Error inserting new entry:", error);
          throw error;
        }
      }

      console.log("Operation successful, refreshing materials");
      showSuccess("Estoque inicial adicionado!");
      fetchMaterials(); // Refresh
    } catch (error) {
      console.error("Error adding initial stock:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar estoque inicial.";
      showError(errorMessage);
    }
  };