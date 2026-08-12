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
-- RESEND_API_KEY         = re_xxxxxxxxxxxx (de resend.com > API Keys)
-- DAILY_BRIEF_TO         = tu-correo@dominio.com (SOLO el correo dueño de la cuenta Resend —
--                          en modo sandbox, sin dominio verificado, Resend no entrega a nadie más)
-- DAILY_BRIEF_FROM       = onboarding@resend.dev (fijo en sandbox; solo cambia si se verifica un dominio propio)
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
-- NOTA SOBRE RESEND (modo sandbox, sin dominio propio)
-- ═══════════════════════════════════════════════════════════
--
--   1. Crear cuenta gratis en resend.com (sin tarjeta)
--   2. Dashboard > API Keys > Create API Key (Full Access)
--   3. Sin verificar un dominio propio, Resend SOLO entrega al
--      correo con el que se creó la cuenta — ningún otro destinatario
--      recibirá el email, aunque la API devuelva éxito
--   4. DAILY_BRIEF_TO debe ser exactamente ese correo
--   5. Peter reenvía manualmente el brief al resto del equipo
--
-- Para enviar directo a varios destinatarios sin reenvío manual,
-- el siguiente paso es verificar un dominio propio en Resend
-- (Domains > Add Domain > agregar registros DNS) — una vez
-- verificado, DAILY_BRIEF_FROM puede usar ese dominio y
-- DAILY_BRIEF_TO puede listar múltiples correos separados por coma.
--
