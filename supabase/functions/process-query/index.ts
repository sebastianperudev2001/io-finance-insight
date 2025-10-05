import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log("Processing query:", query);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Usar IA para convertir lenguaje natural a SQL
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un experto en SQL y análisis de datos de clientes. Convierte consultas en lenguaje natural a consultas SQL para la tabla 'clientes' que tiene las siguientes columnas:
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
1. Devuelve SOLO la consulta SQL, sin explicaciones
2. Usa SELECT * FROM public.clientes para consultas básicas
3. Siempre incluye WHERE activo = true si no se especifica lo contrario
4. Para segmentos, usa WHERE segmento = 'nombre_exacto'
5. Ordena por valor_cliente DESC si es relevante`,
          },
          {
            role: "user",
            content: query,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const sqlQuery = aiData.choices[0].message.content.trim().replace(/```sql\n?/g, "").replace(/```\n?/g, "");
    console.log("Generated SQL:", sqlQuery);

    // Ejecutar la consulta SQL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: results, error: dbError } = await supabase.rpc("execute_query", {
      query_text: sqlQuery,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Query results:", results?.length || 0, "rows");

    return new Response(
      JSON.stringify({
        success: true,
        sql: sqlQuery,
        results: results || [],
        message: `Encontré ${results?.length || 0} clientes que coinciden con tu consulta.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing query:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
