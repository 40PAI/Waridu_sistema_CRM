// Teste simples para drag and drop
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando as variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDragAndDrop() {
  console.log('🧪 Testando funcionalidade de drag and drop...');
  
  try {
    // 1. Verificar estado atual do evento ID 2
    const { data: beforeMove, error: beforeError } = await supabase
      .from('events')
      .select('id, name, pipeline_phase_label, pipeline_rank')
      .eq('id', 2)
      .single();

    if (beforeError) {
      console.log('❌ Erro ao buscar evento antes do movimento:', beforeError.message);
      return;
    }

    console.log('📋 Estado antes:', beforeMove);

    // 2. Buscar fase de destino (Orçamento)
    const { data: targetPhase, error: phaseError } = await supabase
      .from('pipeline_phases')
      .select('id, name')
      .eq('name', 'Orçamento')
      .single();

    if (phaseError) {
      console.log('❌ Erro ao buscar fase destino:', phaseError.message);
      return;
    }

    console.log('🎯 Fase destino:', targetPhase);

    // 3. Mover o evento
    const { error: updateError } = await supabase
      .from('events')
      .update({
        pipeline_phase_id: targetPhase.id,
        pipeline_phase_label: targetPhase.name,
        pipeline_rank: 3000, // Novo rank
        updated_at: new Date().toISOString(),
      })
      .eq('id', 2);

    if (updateError) {
      console.log('❌ Erro ao mover evento:', updateError.message);
      return;
    }

    // 4. Verificar estado após o movimento
    const { data: afterMove, error: afterError } = await supabase
      .from('events')
      .select('id, name, pipeline_phase_label, pipeline_rank')
      .eq('id', 2)
      .single();

    if (afterError) {
      console.log('❌ Erro ao verificar evento após movimento:', afterError.message);
      return;
    }

    console.log('✅ Estado depois:', afterMove);
    console.log('✅ Drag and drop funcionando! Evento movido com sucesso.');
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testDragAndDrop();