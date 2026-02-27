-- Migrar datos de ConfiguracionSalario a FuenteIngreso (si existe)
INSERT INTO "FuenteIngreso" (id, nombre, monto, frecuencia, "diaSemana", "fechaBase", activo, "createdAt")
SELECT
  'csal_migrated_01',
  'Salario',
  monto,
  'QUINCENAL'::"FrecuenciaPago",
  1,
  "fechaBaseProximoPago",
  true,
  now()
FROM "ConfiguracionSalario"
WHERE id = 1
ON CONFLICT (id) DO NOTHING;

-- RemoveTable
DROP TABLE "ConfiguracionSalario";
