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
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    console.log('Procesando consulta:', query);

    // PASO 1: Clasificar la consulta del usuario usando OpenAI
    const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
        temperature: 0,
      }),
    });

    if (!classificationResponse.ok) {
      const errorText = await classificationResponse.text();
      console.error('Error en clasificación:', errorText);
      throw new Error('Error al clasificar la consulta');
    }

    const classificationData = await classificationResponse.json();
    const queryType = classificationData.choices[0].message.content.trim();

    console.log('Tipo de consulta:', queryType);

    // Si es una pregunta general, responder directamente
    if (queryType === 'GENERAL') {
      const generalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
          temperature: 0.7,
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

    // PASO 2: Generar SQL query usando OpenAI
    const sqlResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un traductor de lenguaje natural a SQL para PostgreSQL.

TABLA: clientes
COLUMNAS:
- id (UUID)
- email (TEXT)
- nombre (TEXT)
- empresa (TEXT)
- telefono (TEXT)
- segmento (TEXT) - valores posibles: 'Premium', 'Estándar', 'VIP'
- valor_cliente (NUMERIC)
- fecha_registro (TIMESTAMP)
- activo (BOOLEAN)

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con el SQL query, nada más
2. NO incluyas explicaciones, comentarios, ni texto adicional
3. NO uses markdown, comillas triples, ni bloques de código
4. SIEMPRE incluye la columna email en el SELECT
5. SIEMPRE usa LIMIT 100 al final
6. Solo usa SELECT (nunca INSERT, UPDATE, DELETE)
7. Si la consulta es vaga o no específica, devuelve: SELECT * FROM clientes LIMIT 100

EJEMPLOS:
Usuario: "Muéstrame clientes Premium"
Respuesta: SELECT * FROM clientes WHERE segmento = 'Premium' LIMIT 100

Usuario: "Lista clientes activos"
Respuesta: SELECT * FROM clientes WHERE activo = true LIMIT 100

Usuario: "Clientes con valor mayor a 15000"
Respuesta: SELECT * FROM clientes WHERE valor_cliente > 15000 LIMIT 100

Usuario: "Muéstrame todos los clientes"
Respuesta: SELECT * FROM clientes LIMIT 100`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0,
      }),
    });

    if (!sqlResponse.ok) {
      const errorText = await sqlResponse.text();
      console.error('Error al generar SQL:', errorText);
      throw new Error('Error al generar SQL con OpenAI');
    }

    const sqlData = await sqlResponse.json();
    let sqlQuery = sqlData.choices[0].message.content.trim()
      .replace(/```sql\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('SQL generado:', sqlQuery);

    // Validar que la respuesta sea SQL válido (debe empezar con SELECT)
    if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
      console.warn('La respuesta no es SQL válido, usando query por defecto');
      sqlQuery = 'SELECT * FROM clientes LIMIT 100';
    }

    // PASO 3: Ejecutar la consulta SQL en Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let queryResults: any[] = [];

    try {
      // Intentar ejecutar el SQL directamente usando rpc
      const { data: rpcData, error: rpcError } = await supabaseClient.rpc('execute_sql', {
        sql_query: sqlQuery
      });

      if (rpcError) {
        console.error('Error ejecutando SQL con RPC:', rpcError);
        throw rpcError;
      }

      // El RPC retorna un array con un objeto que contiene el resultado
      if (rpcData && rpcData.length > 0 && rpcData[0].result) {
        queryResults = rpcData[0].result;
      } else {
        queryResults = [];
      }
    } catch (rpcError) {
      console.error('Error en RPC, usando fallback:', rpcError);
      // Fallback: intentar consulta básica con el SDK
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('clientes')
        .select('*')
        .limit(100);
      
      if (fallbackError) {
        throw fallbackError;
      }
      
      queryResults = fallbackData || [];
    }

    console.log(`Resultados obtenidos: ${queryResults.length} registros`);

    // PASO 4: Generar respuesta personalizada con OpenAI basada en los resultados
    const responseGeneration = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres Marcio, el asistente de IO Finance especializado en marketing y segmentación de clientes.

Tu tarea es presentar los resultados de una consulta de segmentación de manera profesional y accionable.

ESTRUCTURA DE TU RESPUESTA:
1. Saludo entusiasta con el número de clientes encontrados
2. Análisis breve de los datos (segmentos, valores promedio, etc.)
3. Insight o recomendación basada en los datos
4. Mención de los próximos pasos disponibles (descargar CSV, personalizar template, lanzar campaña)

ESTILO:
- Usa 2-3 emojis relevantes (🎯, 📊, 💼, ✅, 🚀, 💰)
- Usa markdown para destacar información (**negrita** para números importantes)
- Usa listas con • para los próximos pasos
- Máximo 5-6 líneas
- Tono profesional pero amigable`
          },
          {
            role: 'user',
            content: `Consulta del usuario: "${query}"

Resultados: ${queryResults.length} clientes encontrados

Datos de los primeros clientes:
${JSON.stringify(queryResults.slice(0, 5), null, 2)}

Genera una respuesta personalizada analizando estos datos.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!responseGeneration.ok) {
      const errorText = await responseGeneration.text();
      console.error('Error generando respuesta personalizada:', errorText);
      throw new Error('Error al generar respuesta personalizada con OpenAI');
    }

    const responseData = await responseGeneration.json();
    const personalizedAnswer = responseData.choices[0].message.content;
    
    console.log('Respuesta personalizada generada:', personalizedAnswer);

    return new Response(
      JSON.stringify({ 
        type: 'database',
        data: queryResults, 
        sqlQuery: sqlQuery,
        answer: personalizedAnswer
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
