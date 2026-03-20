// /api/cron/fetch-news — Fetch RSS feeds and store in Supabase
// Trigger via Vercel Cron or manual GET request

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

const FEEDS = [
  // ── Medios oficialistas ──
  { name:"VTV", feed:"https://www.vtv.gob.ve/feed/", type:"news" },
  { name:"VTV Canal8", feed:"https://canal8.com.ve/feed/", type:"news" },
  { name:"Correo del Orinoco", feed:"https://www.correodelorinoco.gob.ve/feed/", type:"news" },
  { name:"RNV", feed:"https://www.rnv.gob.ve/feed/", type:"news" },
  { name:"TeleSUR", feed:"https://www.telesurtv.net/feed/", type:"news" },
  // ── Medios independientes / críticos ──
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", type:"news" },
  { name:"El Diario", feed:"https://eldiario.com/feed/", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", type:"news" },
  { name:"Armando.Info", feed:"https://armando.info/feed/", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", type:"news" },
  { name:"Tal Cual Flipboard", feed:"https://talcualdigital.com/feed-flipboard/", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", type:"news" },
  { name:"Crónica Uno", feed:"https://cronica.uno/feed/", type:"news" },
  { name:"Analitica", feed:"https://analitica.com/feed/", type:"news" },
  { name:"Prodavinci", feed:"https://prodavinci.com/feed/", type:"news" },
  { name:"Caracas Chronicles", feed:"https://caracaschronicles.com/feed/", type:"news" },
  { name:"Radio Fe y Alegría", feed:"https://radiofeyalegrianoticias.com/feed/", type:"news" },
  // ── Medios generalistas ──
  { name:"El Nacional", feed:"https://www.elnacional.com/feed/", type:"news" },
  { name:"La Patilla", feed:"https://www.lapatilla.com/feed/", type:"news" },
  { name:"Caraota Digital", feed:"https://www.caraotadigital.net/feed/", type:"news" },
  { name:"Alberto News", feed:"https://albertonews.com/feed/", type:"news" },
  { name:"Maduradas", feed:"https://maduradas.com/feed/", type:"news" },
  { name:"Noticiero Digital", feed:"https://noticierodigital.com/feed/", type:"news" },
  { name:"Últimas Noticias", feed:"https://ultimasnoticias.com.ve/feed/", type:"news" },
  // ── Medios regionales ──
  { name:"Correo del Caroní", feed:"https://correodelcaroni.com/feed/", type:"news" },
  { name:"Nuevo Día", feed:"https://nuevodia.com.ve/feed/", type:"news" },
  { name:"Entorno Inteligente", feed:"https://entornointeligente.com/feed/", type:"news" },
  { name:"Diario La Región", feed:"https://diariolaregion.net/feed/", type:"news" },
  { name:"Diario de los Andes", feed:"https://diariodelosandes.com/feed/", type:"news" },
  { name:"Diario Avance", feed:"https://diarioavance.com/feed/", type:"news" },
  { name:"La Nación", feed:"https://lanacionweb.com/feed/", type:"news" },
  { name:"La Nación Deportes", feed:"https://lanaciondeportes.com/feed/", type:"news" },
  { name:"La Verdad de Monagas", feed:"https://laverdaddemonagas.com/feed/", type:"news" },
  { name:"Periódico de Monagas", feed:"https://elperiodicodemonagas.com.ve/feed/", type:"news" },
  { name:"El Clarín", feed:"https://elclarinweb.com/feed/", type:"news" },
  { name:"Diario La Voz", feed:"https://diariolavoz.net/feed/", type:"news" },
  { name:"La Razón", feed:"https://larazon.net/feed/", type:"news" },
  // ── Medios internacionales ──
  { name:"BBC Lat Am", feed:"https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", type:"news" },
  { name:"NYT World", feed:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml", type:"news" },
  { name:"Al Jazeera", feed:"https://www.aljazeera.com/xml/rss/all.xml", type:"news" },
  { name:"The Guardian VE", feed:"https://www.theguardian.com/world/venezuela/rss", type:"news" },
  { name:"Infobae", feed:"https://www.infobae.com/feeds/rss/", type:"news" },
  { name:"El País", feed:"https://elpais.com/rss/elpais/portada.xml", type:"news" },
  { name:"France24", feed:"https://www.france24.com/es/am%C3%A9rica-latina/rss", type:"news" },
  { name:"ABC Internacional", feed:"https://www.abc.es/rss/atom/internacional", type:"news" },
  { name:"MercoPress", feed:"https://en.mercopress.com/rss/latin-america", type:"news" },
  { name:"El Tiempo VE", feed:"https://www.eltiempo.com/rss/venezuela.xml", type:"news" },
  { name:"Google News Reuters VE", feed:"https://news.google.com/rss/search?q=venezuela+reuters", type:"news" },
  // ── Especializados / análisis ──
  { name:"Venezuela Analysis", feed:"https://venezuelanalysis.com/feed/", type:"news" },
  { name:"Banca y Negocios", feed:"https://www.bancaynegocios.com/feed/", type:"news" },
  { name:"Bitácora Económica", feed:"https://bitacoraeconomica.com/feed/", type:"news" },
  { name:"Contrapunto", feed:"https://contrapunto.com/feed/", type:"news" },
  { name:"Descifrado", feed:"https://descifrado.com/feed/", type:"news" },
  // ── Google News aggregator ──
  { name:"Google News VE", feed:"https://news.google.com/rss/search?q=venezuela", type:"news" },
  { name:"Google News VE Economía", feed:"https://news.google.com/rss/search?q=venezuela+economia", type:"news" },
  { name:"Google News VE Política", feed:"https://news.google.com/rss/search?q=venezuela+politica", type:"news" },
  // ── Fact-checkers ──
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", type:"factcheck" },
  { name:"El Diario Chequéalo", feed:"https://eldiario.com/categoria/chequealo/feed/", type:"factcheck" },
  { name:"Cotejo.info", feed:"https://cotejo.info/feed/", type:"factcheck" },
  { name:"Cazamos Fake News", feed:"https://www.cazadoresdefakenews.info/feed/", type:"factcheck" },
  { name:"Provea", feed:"https://provea.org/feed/", type:"factcheck" },
];

const SCENARIO_TAGS = {
  E1: /elecci[oó]n|electoral|voto|transici[oó]n|democra|MCM|Machado|oposici[oó]n|preso.pol[ií]tico|amnist[ií]a|excarcel/i,
  E2: /colapso|crisis|inflaci[oó]n|apag[oó]n|el[eé]ctric|salario|hambre|migra|pobreza|FMI|deuda|brecha.cambiar/i,
  E3: /petr[oó]le|PDVSA|OFAC|licencia|Chevron|exportaci|barril|EE\.UU|Trump|Delcy|cooperaci|diploma|sancion/i,
  E4: /FANB|militar|colectivo|represi[oó]n|detenci[oó]n|preso|SEBIN|DGCIM|Cabello|coerci|arma|violencia/i,
};

const DIM_TAGS = {
  "Energético": /petr[oó]le|PDVSA|crudo|barril|refiner|gas|energ|taladro|Chevron|Eni|Repsol|Shell|BP|OFAC|licencia|exportaci|bpd|OPEP|VLCC|Vitol|Trafigura/i,
  "Político": /elecci[oó]n|electoral|amnist[ií]a|excarcel|preso|pol[ií]tic|Asamblea|AN |diput|partido|oposici|oficialis|Delcy|Cabello|Rodr[ií]guez|MCM|Machado|FANB|militar|PSUV|govern/i,
  "Económico": /inflaci[oó]n|salario|bol[ií]var|d[oó]lar|cambiar|BCV|precio|econ[oó]m|PIB|FMI|deuda|canasta|pobreza|cripto|USDT|brecha|subasta|divisa/i,
  "Internacional": /EE\.UU|Trump|Rubio|UE|Europa|ONU|Colombia|Petro|China|Rusia|sanci[oó]n|diplom|embajad|fronter|migra|SOUTHCOM|geopo/i,
};

// AI providers for news alerts (Mistral first)
const AI_CASCADE_ALERTS = [
  { name: "mistral", key: "MISTRAL_API_KEY", url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-small-latest" },
  { name: "gemini", key: "GEMINI_API_KEY", url: null, model: "gemini-1.5-flash" },
  { name: "groq", key: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" },
  { name: "openrouter", key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.1-8b-instruct:free" },
];

module.exports = { SUPABASE_URL, SUPABASE_SECRET, FEEDS, SCENARIO_TAGS, DIM_TAGS, AI_CASCADE_ALERTS };
