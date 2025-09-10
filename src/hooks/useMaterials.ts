import { useState } from "react";
import { PageMaterial, InventoryMaterial, MaterialStatus } from "@/types";

export const useMaterials = () => {
  const initialMaterials: InventoryMaterial[] = [
    { id: 'MAT001', name: 'Câmera Sony A7S III', status: 'Disponível', category: 'Câmeras', description: 'Câmera mirrorless full-frame com alta sensibilidade.', locations: { 'loc-1': 5 } },
    { id: 'MAT002', name: 'Lente Canon 24-70mm', status: 'Em uso', category: 'Lentes', description: 'Lente zoom padrão versátil com abertura f/2.8.', locations: { 'loc-1': 8 } },
    { id: 'MAT003', name: 'Kit de Luz Aputure 300D', status: 'Disponível', category: 'Iluminação', description: 'Kit de iluminação LED potente com 3 pontos de luz.', locations: { 'loc-1': 3 } },
    { id: 'MAT004', name: 'Microfone Rode NTG5', status: 'Manutenção', category: 'Áudio', description: 'Microfone shotgun profissional para gravação de áudio direcional.', locations: { 'loc-1': 10 } },
    { id: 'MAT005', name: 'Tripé Manfrotto', status: 'Disponível', category: 'Acessórios', description: 'Tripé de vídeo robusto com cabeça fluida.', locations: { 'loc-1': 12 } },
    { id: 'MAT006', name: 'Cabo HDMI 10m', status: 'Disponível', category: 'Cabos', description: 'Cabo HDMI 2.0 de alta velocidade com 10 metros.', locations: { 'loc-1': 30 } },
    { id: 'MAT007', name: 'Gravador Zoom H6', status: 'Em uso', category: 'Áudio', description: 'Gravador de áudio portátil com 6 canais.', locations: { 'loc-1': 4 } },
    { id: 'MAT008', name: 'Monitor de Referência', status: 'Disponível', category: 'Acessórios', description: 'Monitor de 7 polegadas para referência de vídeo em campo.', locations: { 'loc-1': 2 } },
  ];

  const [materials, setMaterials] = useState<InventoryMaterial[]>(initialMaterials);

  const saveMaterial = (materialData: Omit<PageMaterial, 'id' | 'locations'> & { id?: string }) => {
    if (materialData.id) {
      setMaterials(prev =>
        prev.map(m => m.id === materialData.id ? {
          ...m,
          name: materialData.name,
          category: materialData.category,
          status: materialData.status as MaterialStatus,
          description: materialData.description,
        } : m)
      );
    } else {
      // In a real app, we would get the first location from the locations hook
      const firstLoc = { id: 'loc-1', name: 'Armazém' };
      const newMat: InventoryMaterial = {
        id: `MAT${Math.floor(Math.random() * 900) + 100}`,
        name: materialData.name,
        category: materialData.category,
        status: materialData.status as MaterialStatus,
        description: materialData.description,
        locations: firstLoc ? { [firstLoc.id]: materialData.quantity } : {},
      };
      setMaterials(prev => [...prev, newMat]);
    }
  };

  const transferMaterial = (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      const available = (m.locations[fromLocationId] || 0);
      if (quantity <= 0 || quantity > available) return m;
      const newLocs = { ...m.locations };
      newLocs[fromLocationId] = available - quantity;
      newLocs[toLocationId] = (newLocs[toLocationId] || 0) + quantity;
      return { ...m, locations: newLocs };
    }));
  };

  const pageMaterials: PageMaterial[] = materials.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    status: m.status,
    description: m.description,
    locations: m.locations,
    quantity: Object.values(m.locations).reduce((a, b) => a + b, 0),
  }));

  return {
    materials: pageMaterials,
    rawMaterials: materials,
    saveMaterial,
    transferMaterial
  };
};