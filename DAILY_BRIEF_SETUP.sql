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
-- SENDGRID_API_KEY       = SG.xxxxxxxxxxxx (de sendgrid.com > Settings > API Keys)
-- DAILY_BRIEF_TO         = email1@dominio.com,email2@dominio.com,email3@dominio.com
-- DAILY_BRIEF_FROM       = tu-email-verificado@dominio.com (el Single Sender verificado)
-- DAILY_BRIEF_FROM_NAME  = Monitor PNUD Venezuela (opcional, nombre del remitente)
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
-- NOTA SOBRE SENDGRID (Twilio)
-- ═══════════════════════════════════════════════════════════
--
-- SendGrid NO requiere dominio propio. Solo necesitas:
--   1. Crear cuenta gratis en sendgrid.com (100 emails/día)
--   2. Settings > Sender Authentication > Single Sender Verification
--   3. Agregas tu email personal (Gmail, Outlook, etc.)
--   4. SendGrid te envía un email de confirmación → click verify
--   5. Settings > API Keys > Create API Key (Full Access)
--   6. Puedes enviar a CUALQUIER email sin restricción
--
-- Para agregar más destinatarios, solo edita DAILY_BRIEF_TO
-- en Vercel separando por coma:
--   email1@org.com,email2@org.com,email3@org.com
--
