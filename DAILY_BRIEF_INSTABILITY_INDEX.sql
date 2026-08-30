-- ═══════════════════════════════════════════════════════════
-- Vincular el Nivel de Riesgo del Daily Brief con el
-- Índice de Inestabilidad Compuesto del dashboard (25 factores)
-- Ejecutar en Supabase SQL Editor ANTES de desplegar este cambio.
--
-- IMPORTANTE: si no se corre esto antes del deploy, el write-back
-- del frontend a daily_readings (bilateral_v, gdelt_tone, brecha,
-- brent, wti, y ahora instability_index) fallará COMPLETO — Supabase
-- rechaza el upsert entero si referencia una columna que no existe.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE daily_readings ADD COLUMN IF NOT EXISTS instability_index SMALLINT;
ALTER TABLE daily_briefs   ADD COLUMN IF NOT EXISTS instability_index SMALLINT;
