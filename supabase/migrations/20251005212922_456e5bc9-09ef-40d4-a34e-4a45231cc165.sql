-- Crear tabla de clientes para las campañas de marketing
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  empresa TEXT,
  telefono TEXT,
  segmento TEXT,
  valor_cliente DECIMAL(10,2),
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activo BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_segmento ON public.clientes(segmento);
CREATE INDEX idx_clientes_activo ON public.clientes(activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO public.clientes (email, nombre, empresa, telefono, segmento, valor_cliente, activo) VALUES
('juan.perez@techcorp.com', 'Juan Pérez', 'TechCorp SA', '+1234567890', 'Premium', 15000.00, true),
('maria.garcia@innovatech.com', 'María García', 'InnovaTech', '+1234567891', 'Premium', 22000.00, true),
('carlos.lopez@startup.io', 'Carlos López', 'Startup IO', '+1234567892', 'Estándar', 8000.00, true),
('ana.martinez@finance.com', 'Ana Martínez', 'Finance Solutions', '+1234567893', 'Premium', 18000.00, true),
('pedro.sanchez@consulting.com', 'Pedro Sánchez', 'Consulting Group', '+1234567894', 'Estándar', 9500.00, true),
('lucia.rodriguez@ventures.com', 'Lucía Rodríguez', 'Ventures Capital', '+1234567895', 'VIP', 35000.00, true),
('miguel.fernandez@corp.com', 'Miguel Fernández', 'Corp International', '+1234567896', 'Estándar', 7500.00, true),
('sofia.gonzalez@enterprise.com', 'Sofía González', 'Enterprise LLC', '+1234567897', 'Premium', 16500.00, true),
('diego.torres@solutions.com', 'Diego Torres', 'Solutions Inc', '+1234567898', 'Estándar', 10000.00, false),
('carmen.ramirez@holdings.com', 'Carmen Ramírez', 'Holdings SA', '+1234567899', 'VIP', 42000.00, true);