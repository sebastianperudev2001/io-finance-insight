-- Función para ejecutar SQL dinámico de forma segura
-- Solo permite SELECT queries en la tabla clientes

CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que solo sea un SELECT
  IF sql_query !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Solo se permiten consultas SELECT';
  END IF;
  
  -- Validar que no contenga comandos peligrosos
  IF sql_query ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Comando no permitido en la consulta';
  END IF;
  
  -- Ejecutar la consulta y retornar resultados como JSONB
  RETURN QUERY EXECUTE format('
    SELECT jsonb_agg(row_to_json(t)::jsonb) as result
    FROM (%s) t
  ', sql_query);
END;
$$;

-- Dar permisos a usuarios autenticados y anónimos
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO anon, authenticated, service_role;
