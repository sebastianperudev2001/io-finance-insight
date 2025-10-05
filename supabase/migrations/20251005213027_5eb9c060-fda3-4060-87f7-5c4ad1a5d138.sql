-- Crear función para ejecutar consultas SQL dinámicas de forma segura
CREATE OR REPLACE FUNCTION public.execute_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_data JSONB;
BEGIN
  -- Validar que la consulta sea solo SELECT
  IF query_text !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Validar que no contenga comandos peligrosos
  IF query_text ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Query contains forbidden commands';
  END IF;

  -- Ejecutar la consulta y convertir a JSONB
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result_data;

  RETURN COALESCE(result_data, '[]'::JSONB);
END;
$$;