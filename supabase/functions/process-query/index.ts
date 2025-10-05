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
    console.log('llego aquí')
    // Paso 1: Determinar si la consulta requiere datos de la base de datos
    const classificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Eres un clasificador de consultas. Determina si la pregunta del usuario requiere consultar datos de la base de datos de clientes o si es una pregunta general.

Responde SOLO con "DATABASE" o "GENERAL".

Ejemplos:
- "Muéstrame clientes Premium" -> DATABASE
- "Lista todos los clientes activos" -> DATABASE
- "¿Cuántos clientes tenemos?" -> DATABASE
- "¿Qué es IO Finance?" -> GENERAL
- "¿Cómo funciona el sistema?" -> GENERAL
- "Hola" -> GENERAL
- "¿Qué puedes hacer?" -> GENERAL`
          },
          {
            role: 'user',
            content: query
          }
        ],
      }),
    });

    if (!classificationResponse.ok) {
      throw new Error('Error al clasificar la consulta');
    }

    const classificationData = await classificationResponse.json();
    const queryType = classificationData.choices[0].message.content.trim();

    console.log('Tipo de consulta:', queryType);

    // Si es una pregunta general, responder directamente
    if (queryType === 'GENERAL') {
      const generalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: `Eres Marcio, el asistente de IO Finance. IO Finance es una plataforma de marketing inteligente que ayuda a las empresas a segmentar y gestionar campañas de email para sus clientes.

Tus capacidades incluyen:
- Consultar la base de datos de clientes usando lenguaje natural
- Segmentar clientes por diferentes criterios (segmento, valor, estado, fecha)
- Generar reportes en CSV
- Crear y personalizar templates de email con variables dinámicas
- Lanzar campañas de email personalizadas

Responde de manera amigable, concisa y profesional. Usa emojis cuando sea apropiado. Si te preguntan sobre funcionalidades, menciona ejemplos concretos.`
            },
            {
              role: 'user',
              content: query
            }
          ],
        }),
      });

      if (!generalResponse.ok) {
        throw new Error('Error al generar respuesta general');
      }

      const generalData = await generalResponse.json();
      const answer = generalData.choices[0].message.content;

      return new Response(
        JSON.stringify({ 
          type: 'general',
          answer: answer,
          data: null,
          sqlQuery: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si requiere base de datos, proceder con SQL
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
      JSON.stringify({ 
        type: 'database',
        data, 
        sqlQuery 
      }),
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
