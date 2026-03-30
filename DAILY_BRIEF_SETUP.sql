-- ═══════════════════════════════════════════════════════════
-- DAILY BRIEF — Setup Guide
-- Ejecutar en Supabase SQL Editor ANTES del primer test
-- ═══════════════════════════════════════════════════════════

-- 1. Crear tabla para log de briefs enviados
CREATE TABLE IF NOT EXISTS daily_briefs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  risk_level TEXT,
  summary TEXT,
  alerts JSONB,
  provider TEXT,
  sent_to TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice por fecha para queries rápidos
CREATE INDEX IF NOT EXISTS idx_daily_briefs_date ON daily_briefs(date DESC);

-- ═══════════════════════════════════════════════════════════
-- VARIABLES DE ENTORNO — Agregar en Vercel Dashboard
-- Settings > Environment Variables
-- ═══════════════════════════════════════════════════════════
--
-- RESEND_API_KEY        = re_xxxxxxxxxxxx (de resend.com/api-keys)
-- DAILY_BRIEF_TO        = tu-email@dominio.com (el mismo de tu cuenta Resend)
-- DAILY_BRIEF_FROM      = onboarding@resend.dev (por ahora, sin dominio propio)
--
-- ═══════════════════════════════════════════════════════════
-- TEST MANUAL — Después del deploy
-- ═══════════════════════════════════════════════════════════
--
-- Visitar en el navegador:
-- https://dashboard-ven-monitor-app.vercel.app/api/cron?task=dailyBrief
--
-- Respuesta esperada:
-- { "task": "dailyBrief", "sent": true, "risk": "MEDIO", 
--   "recipients": 1, "provider": "mistral", ... }
--
-- ═══════════════════════════════════════════════════════════
-- CRON AUTOMÁTICO — cron-job.org (después de verificar test)
-- ═══════════════════════════════════════════════════════════
--
-- 1. Ir a https://cron-job.org y crear cuenta
-- 2. Crear nuevo job:
--    URL: https://dashboard-ven-monitor-app.vercel.app/api/cron?task=dailyBrief
--    Schedule: 0 11 * * * (11:00 UTC = 7:00 AM Venezuela)
--    Method: GET
--
-- ═══════════════════════════════════════════════════════════
-- NOTA SOBRE onboarding@resend.dev
-- ═══════════════════════════════════════════════════════════
--
-- Con la dirección de prueba de Resend SOLO puedes enviar al
-- email verificado de tu cuenta. Para enviar a 2-3 personas
-- necesitas agregar un dominio propio en Resend:
--   1. Resend Dashboard > Domains > Add Domain
--   2. Agregar registros DNS (MX, TXT) que Resend te indica
--   3. Cambiar DAILY_BRIEF_FROM a monitor@tu-dominio.com
--   4. Agregar los otros emails a DAILY_BRIEF_TO separados por coma
--
