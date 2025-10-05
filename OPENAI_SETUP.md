# Configuración de OpenAI API

## Resumen de la Integración

Este proyecto ahora utiliza la API de OpenAI para procesar consultas de usuarios en 3 pasos:

1. **Clasificación**: Determina si la consulta requiere datos de la base de datos o es una pregunta general
2. **Generación SQL**: Convierte consultas en lenguaje natural a SQL válido para PostgreSQL
3. **Respuesta Personalizada**: Genera una respuesta amigable basada en los resultados de la consulta

## Configuración

### 1. Obtener API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Crea una nueva API key
4. Copia la key (comienza con `sk-...`)

### 2. Configurar en Supabase

#### Opción A: Usando Supabase CLI (Local)

```bash
# En tu terminal, navega al proyecto
cd /home/lordbastian/Documents/github-personal/io-finance-insight

# Configura la variable de entorno
supabase secrets set OPENAI_API_KEY=sk-tu-api-key-aqui
```

#### Opción B: Usando Supabase Dashboard (Producción)

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** → **Edge Functions** → **Secrets**
3. Agrega un nuevo secret:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-tu-api-key-aqui`
4. Guarda los cambios

### 3. Aplicar la Migración de Base de Datos

La función `execute_sql` necesita ser creada en tu base de datos:

```bash
# Si estás usando Supabase local
supabase db reset

# O aplica la migración específica
supabase migration up
```

Si estás en producción, aplica la migración desde el Dashboard:
1. Ve a **Database** → **Migrations**
2. Sube el archivo `supabase/migrations/20251005_create_execute_sql_function.sql`

### 4. Desplegar la Edge Function

```bash
# Despliega la función actualizada
supabase functions deploy process-query
```

## Modelo Utilizado

El proyecto usa **gpt-4o-mini** que es:
- ✅ Rápido y eficiente
- ✅ Económico (mucho más barato que GPT-4)
- ✅ Suficientemente capaz para clasificación, SQL y generación de respuestas

### Costos Estimados (gpt-4o-mini)

- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Ejemplo**: 1000 consultas de usuarios ≈ $0.50 - $1.00 USD

## Flujo de Datos

```
Usuario → Frontend (React)
    ↓
Supabase Edge Function (process-query)
    ↓
OpenAI API (Paso 1: Clasificación)
    ↓
OpenAI API (Paso 2: Generar SQL) → Supabase DB (Ejecutar SQL)
    ↓
OpenAI API (Paso 3: Respuesta personalizada)
    ↓
Frontend (Mostrar resultados)
```

## Seguridad

- ✅ La función `execute_sql` solo permite consultas SELECT
- ✅ Bloquea comandos peligrosos (DROP, DELETE, UPDATE, etc.)
- ✅ La API key está protegida en variables de entorno
- ✅ Las Edge Functions se ejecutan en un entorno aislado

## Troubleshooting

### Error: "OPENAI_API_KEY no configurada"
→ Asegúrate de haber configurado el secret en Supabase

### Error: "function execute_sql does not exist"
→ Aplica la migración de base de datos

### Error: "Rate limit exceeded"
→ Has excedido el límite de la API de OpenAI. Espera unos minutos o aumenta tu límite en OpenAI

### Las respuestas son genéricas
→ Verifica que el modelo esté recibiendo los datos correctos en el Paso 4

## Próximos Pasos

- [ ] Monitorear costos en el dashboard de OpenAI
- [ ] Implementar caché para consultas frecuentes
- [ ] Agregar rate limiting en el frontend
- [ ] Considerar usar embeddings para búsquedas semánticas
