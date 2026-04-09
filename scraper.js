/**
 * ============================================================
 * DIAGNÓSTICO AGP — Ver formato crudo de los .dat (CÓDIGO DE CLAUDE)
 * ============================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PUERTO = 'LaPlata';
const BASE   = `http://hidrografia.agpse.gob.ar:53880/${PUERTO}`; // Usamos el puerto 53880 que sabemos que funciona
const BASE2  = `https://hidrografia.agpse.gob.ar/${PUERTO}`;

const URLS_A_PROBAR = [
  { label: 'Marea principal',     url: `${BASE}/histdat/${PUERTO}.dat` },
  { label: 'Marea alternativa 1', url: `${BASE}/histdat/LaPlata_Marea.dat` },
  { label: 'Viento principal',    url: `${BASE}/histdat/${PUERTO}_Viento.dat` },
  { label: 'Viento alternativo',  url: `${BASE}/histdat/LaPlata_Wind.dat` },
  { label: 'Viento base (Descubrimiento anterior)', url: `${BASE}/_Viento.dat` },
  { label: 'iframe marea',        url: `${BASE}/marea.html` },
  { label: 'iframe viento',       url: `${BASE}/viento.html` },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
  'Accept':     'text/plain, text/html, */*',
};

async function probar(label, url) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔍 ${label}`);
  console.log(`   URL: ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    console.log(`   HTTP: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.log('   ❌ No accesible');
      return;
    }

    const texto = await res.text();
    if (!texto.trim()) {
      console.log('   ⚠️  Respuesta vacía');
      return;
    }

    const lineas = texto.trim().split('\n');
    console.log(`   ✅ Líneas totales: ${lineas.length}`);

    console.log('\n   ── Primeras 3 líneas ──────────────────────');
    lineas.slice(0, 3).forEach((l, i) => {
      const partes = l.trim().split(/\s+/);
      console.log(`   [${i}] raw: "${l.trim()}"`);
    });

    console.log('\n   ── Últimas 3 líneas ───────────────────────');
    lineas.slice(-3).forEach((l, i) => {
      const partes = l.trim().split(/\s+/);
      console.log(`   [${lineas.length - 3 + i}] raw: "${l.trim()}"`);
    });

    // Análisis automático de Claude
    const ultimaLinea = lineas[lineas.length - 1].trim().split(/\s+/);
    console.log('\n   ── Análisis automático de la última línea ─');
    ultimaLinea.forEach((col, i) => {
      const num = parseFloat(col);
      let tipo = 'texto';
      if (!isNaN(num)) {
        if (Number.isInteger(num) && num > 1000) tipo = '⚠️ CONTADOR';
        else if (Math.abs(num) < 20)              tipo = '✅ posible ALTURA (metros)';
        else if (num > 0 && num < 400)            tipo = '🧭 posible DIRECCIÓN (grados)';
        else if (num > 0 && num < 200)            tipo = '💨 posible VELOCIDAD (km/h)';
        else                                       tipo = 'número';
      }
      console.log(`   col[${i}] = "${col}" → ${tipo}`);
    });

  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

(async () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  DIAGNÓSTICO AGP (CLAUDE) — Puerto La Plata              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  for (const { label, url } of URLS_A_PROBAR) {
    await probar(label, url);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ Diagnóstico completo.');
})();
