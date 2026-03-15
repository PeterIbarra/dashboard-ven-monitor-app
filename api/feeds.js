// Unified RSS feeds — single source of truth
// Tags: oficialista, independiente, generalista, regional, internacional, factcheck
// Used by: /api/cron (all), /api/news ICG (bias tagged), /api/news RSS (news+factcheck)

const ALL_FEEDS = [
  // ── Oficialistas ──
  { name:"VTV", feed:"https://www.vtv.gob.ve/feed/", bias:"oficialista", type:"news" },
  { name:"VTV Canal8", feed:"https://canal8.com.ve/feed/", bias:"oficialista", type:"news" },
  { name:"Correo del Orinoco", feed:"https://www.correodelorinoco.gob.ve/feed/", bias:"oficialista", type:"news" },
  { name:"RNV", feed:"https://www.rnv.gob.ve/feed/", bias:"oficialista", type:"news" },
  { name:"TeleSUR", feed:"https://www.telesurtv.net/feed/", bias:"oficialista", type:"news" },
  { name:"La Iguana TV", feed:"https://laiguana.tv/feed/", bias:"oficialista", type:"news" },
  { name:"AVN", feed:"https://avn.info.ve/feed/", bias:"oficialista", type:"news" },
  { name:"Aporrea", feed:"https://www.aporrea.org/feed/", bias:"oficialista", type:"news" },

  // ── Independientes / críticos ──
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", bias:"independiente", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", bias:"independiente", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", bias:"independiente", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", bias:"independiente", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", bias:"independiente", type:"news" },
  { name:"Crónica Uno", feed:"https://cronica.uno/feed/", bias:"independiente", type:"news" },
  { name:"Armando.Info", feed:"https://armando.info/feed/", bias:"independiente", type:"news" },
  { name:"Prodavinci", feed:"https://prodavinci.com/feed/", bias:"independiente", type:"news" },
  { name:"Caracas Chronicles", feed:"https://caracaschronicles.com/feed/", bias:"independiente", type:"news", lang:"en" },
  { name:"Radio Fe y Alegría", feed:"https://radiofeyalegrianoticias.com/feed/", bias:"independiente", type:"news" },
  { name:"El Diario", feed:"https://eldiario.com/feed/", bias:"independiente", type:"news" },
  { name:"Venezuela Analysis", feed:"https://venezuelanalysis.com/feed/", bias:"independiente", type:"news", lang:"en" },

  // ── Generalistas nacionales ──
  { name:"El Nacional", feed:"https://www.elnacional.com/feed/", bias:"generalista", type:"news" },
  { name:"La Patilla", feed:"https://www.lapatilla.com/feed/", bias:"generalista", type:"news" },
  { name:"Caraota Digital", feed:"https://www.caraotadigital.net/feed/", bias:"generalista", type:"news" },
  { name:"Alberto News", feed:"https://albertonews.com/feed/", bias:"generalista", type:"news" },
  { name:"Maduradas", feed:"https://maduradas.com/feed/", bias:"generalista", type:"news" },
  { name:"Noticiero Digital", feed:"https://noticierodigital.com/feed/", bias:"generalista", type:"news" },
  { name:"Últimas Noticias", feed:"https://ultimasnoticias.com.ve/feed/", bias:"generalista", type:"news" },
  { name:"Analitica", feed:"https://analitica.com/feed/", bias:"generalista", type:"news" },
  { name:"Banca y Negocios", feed:"https://www.bancaynegocios.com/feed/", bias:"generalista", type:"news" },
  { name:"Contrapunto", feed:"https://contrapunto.com/feed/", bias:"generalista", type:"news" },
  { name:"Descifrado", feed:"https://descifrado.com/feed/", bias:"generalista", type:"news" },
  { name:"Entorno Inteligente", feed:"https://entornointeligente.com/feed/", bias:"generalista", type:"news" },

  // ── Regionales ──
  { name:"Correo del Caroní", feed:"https://correodelcaroni.com/feed/", bias:"regional", type:"news" },
  { name:"Nuevo Día", feed:"https://nuevodia.com.ve/feed/", bias:"regional", type:"news" },
  { name:"Diario La Región", feed:"https://diariolaregion.net/feed/", bias:"regional", type:"news" },
  { name:"Diario de los Andes", feed:"https://diariodelosandes.com/feed/", bias:"regional", type:"news" },
  { name:"Diario Avance", feed:"https://diarioavance.com/feed/", bias:"regional", type:"news" },
  { name:"La Nación", feed:"https://lanacionweb.com/feed/", bias:"regional", type:"news" },
  { name:"La Verdad de Monagas", feed:"https://laverdaddemonagas.com/feed/", bias:"regional", type:"news" },
  { name:"Periódico de Monagas", feed:"https://elperiodicodemonagas.com.ve/feed/", bias:"regional", type:"news" },
  { name:"El Clarín", feed:"https://elclarinweb.com/feed/", bias:"regional", type:"news" },
  { name:"Diario La Voz", feed:"https://diariolavoz.net/feed/", bias:"regional", type:"news" },
  { name:"La Razón", feed:"https://larazon.net/feed/", bias:"regional", type:"news" },
  { name:"La Nación Deportes", feed:"https://lanaciondeportes.com/feed/", bias:"regional", type:"news" },

  // ── Internacionales ──
  { name:"BBC Lat Am", feed:"https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", bias:"internacional", type:"news" },
  { name:"NYT World", feed:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml", bias:"internacional", type:"news", lang:"en" },
  { name:"Al Jazeera", feed:"https://www.aljazeera.com/xml/rss/all.xml", bias:"internacional", type:"news", lang:"en" },
  { name:"The Guardian VE", feed:"https://www.theguardian.com/world/venezuela/rss", bias:"internacional", type:"news", lang:"en" },
  { name:"Infobae", feed:"https://www.infobae.com/feeds/rss/", bias:"internacional", type:"news" },
  { name:"El País", feed:"https://elpais.com/rss/elpais/portada.xml", bias:"internacional", type:"news" },
  { name:"France24", feed:"https://www.france24.com/es/am%C3%A9rica-latina/rss", bias:"internacional", type:"news" },
  { name:"ABC Internacional", feed:"https://www.abc.es/rss/atom/internacional", bias:"internacional", type:"news" },
  { name:"MercoPress", feed:"https://en.mercopress.com/rss/latin-america", bias:"internacional", type:"news", lang:"en" },
  { name:"El Tiempo VE", feed:"https://www.eltiempo.com/rss/venezuela.xml", bias:"internacional", type:"news" },
  { name:"Reuters VE", feed:"https://news.google.com/rss/search?q=venezuela+reuters&hl=en", bias:"internacional", type:"news", lang:"en" },

  // ── Google News aggregated ──
  { name:"Google News VE", feed:"https://news.google.com/rss/search?q=venezuela", bias:"agregador", type:"news" },
  { name:"Google News VE Economía", feed:"https://news.google.com/rss/search?q=venezuela+economia", bias:"agregador", type:"news" },
  { name:"Google News VE Política", feed:"https://news.google.com/rss/search?q=venezuela+politica", bias:"agregador", type:"news" },

  // ── Fact-checkers ──
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", bias:"independiente", type:"factcheck" },
  { name:"Cotejo.info", feed:"https://cotejo.info/feed/", bias:"independiente", type:"factcheck" },
  { name:"EsPaja", feed:"https://espaja.com/feed/", bias:"independiente", type:"factcheck" },
  { name:"Cazamos Fake News", feed:"https://www.cazadoresdefakenews.info/feed/", bias:"independiente", type:"factcheck" },
  { name:"Provea", feed:"https://provea.org/feed/", bias:"independiente", type:"factcheck" },
];

// ── Helper filters ──
const ICG_FEEDS = ALL_FEEDS.filter(f => ["oficialista","independiente","generalista"].includes(f.bias) && f.type === "news");
const CRON_FEEDS = ALL_FEEDS; // cron uses everything
const NEWS_RSS_FEEDS = ALL_FEEDS.filter(f => !["regional","agregador"].includes(f.bias) || f.type === "factcheck");

module.exports = { ALL_FEEDS, ICG_FEEDS, CRON_FEEDS, NEWS_RSS_FEEDS };
