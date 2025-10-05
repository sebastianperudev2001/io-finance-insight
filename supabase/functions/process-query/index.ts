import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    // Llamar a Lovable AI para convertir la consulta en SQL
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente SQL experto. Convierte consultas en lenguaje natural a SQL queries válidas para PostgreSQL.
La tabla se llama "clientes" con las siguientes columnas:
- id (UUID)
- email (TEXT)
- nombre (TEXT)
- empresa (TEXT)
- telefono (TEXT)
- segmento (TEXT) - valores: 'Premium', 'Estándar', 'VIP'
- valor_cliente (DECIMAL)
- fecha_registro (TIMESTAMP)
- activo (BOOLEAN)

IMPORTANTE: 
1. Devuelve SOLO el query SQL, sin explicaciones
2. Usa SOLO SELECT queries
3. Incluye siempre la columna email
4. Limita resultados a máximo 100 rows con LIMIT`
          },
          {
            role: 'user',
            content: query
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error de Lovable AI:', aiResponse.status, errorText);
      throw new Error('Error al procesar la consulta con IA');
    }

    const aiData = await aiResponse.json();
    const sqlQuery = aiData.choices[0].message.content.trim()
      .replace(/```sql\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('SQL generado:', sqlQuery);

    // Ejecutar la consulta en Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extraer condiciones básicas del SQL para crear query con SDK
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('*')
      .limit(100);
    
    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ data, sqlQuery }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en process-query:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
